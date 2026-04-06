# Access Token Denylist — Architecture Flow

## Token Lifecycle: Login → Request → Logout

```mermaid
sequenceDiagram
    participant Client as Client
    participant Guard as ActiveUserGuard
    participant Denylist as TokenDenylist (In-Memory)
    participant JWT as JwtService
    participant Auth as AuthService
    participant Redis as Redis
    participant DB as PostgreSQL

    Note over Client, DB: LOGIN FLOW
    Client->>Auth: POST /auth/login
    Auth->>DB: Find user by email
    DB-->>Auth: User record
    Auth->>JWT: signAccessToken(payload) [TTL: 5m]
    Auth->>JWT: signRefreshToken(jti)
    Auth->>Redis: setSession(jti, sessionData)
    Auth->>DB: upsertByFingerprint(session)
    Auth-->>Client: { accessToken, refreshToken }

    Note over Client, DB: PROTECTED REQUEST (NORMAL)
    Client->>Guard: GET /auth/my-lockout [Bearer token]
    Guard->>JWT: verifyAccessToken(token)
    JWT-->>Guard: payload { sub, jti, ... }
    Guard->>Denylist: isDenied(jti)?
    Denylist-->>Guard: false ✅
    Guard-->>Client: 200 OK

    Note over Client, DB: LOGOUT
    Client->>Guard: POST /auth/logout [Bearer token]
    Guard->>JWT: verifyAccessToken(token)
    Guard->>Denylist: isDenied(jti)?
    Denylist-->>Guard: false ✅ (not yet denied)
    Guard-->>Auth: Proceed
    Auth->>Denylist: deny(jti, 300s)
    Auth->>Redis: deleteSession(jti)
    Auth->>DB: revokeByJti(jti)
    Auth->>Redis: set(revoked_jti:xxx, userId)
    Auth-->>Client: 200 OK — Logged out

    Note over Client, DB: PROTECTED REQUEST (AFTER LOGOUT)
    Client->>Guard: GET /auth/my-lockout [Same Bearer token]
    Guard->>JWT: verifyAccessToken(token)
    JWT-->>Guard: payload { sub, jti, ... }
    Guard->>Denylist: isDenied(jti)?
    Denylist-->>Guard: true 🚫
    Guard-->>Client: 401 Unauthorized
```

## Token Reuse Detection: Compromise Flow

```mermaid
sequenceDiagram
    participant Attacker as Attacker
    participant Auth as AuthService
    participant Denylist as TokenDenylist (In-Memory)
    participant Redis as Redis
    participant DB as PostgreSQL
    participant Events as EventEmitter

    Note over Attacker, Events: Attacker uses a stolen (already-rotated) Refresh Token
    Attacker->>Auth: POST /auth/refresh { refreshToken: OLD }
    Auth->>Redis: get(revoked_jti:xxx)
    Redis-->>Auth: { userId: 42 } MATCH!

    Note over Auth, Events: ⚠️ PANIC PROTOCOL
    Auth->>DB: findActiveByUserId(42)
    DB-->>Auth: [session1, session2, session3]
    Auth->>Denylist: denyMany([jti1, jti2, jti3], 300s)
    Auth->>Redis: deleteSession(jti1), deleteSession(jti2), deleteSession(jti3)
    Auth->>DB: revokeAllByUserId(42)
    Auth->>Events: emit('auth.security.compromise', { userId, ip, ua })
    Events-->>Events: ⚠️ Log warning + (future: send email)
    Auth-->>Attacker: 401 Unauthorized

    Note over Attacker, Events: All devices are now logged out. Even valid tokens are denied.
```

## Component Architecture

```mermaid
graph TB
    subgraph "HTTP Request"
        REQ[Incoming Request]
    end

    subgraph "Guards Layer"
        AUG[ActiveUserGuard]
    end

    subgraph "JWT Module (Global)"
        JWTS[JwtService<br/>sign / verify tokens]
        TDL[TokenDenylistService<br/>In-Memory Map]
    end

    subgraph "Auth Feature"
        AS[AuthService]
        AEL[AuthEventsListener]
    end

    subgraph "Data Layer"
        REDIS[(Redis<br/>Sessions Cache<br/>Revoked JTIs)]
        DB[(PostgreSQL<br/>Sessions Table)]
    end

    REQ --> AUG
    AUG -->|1. verify signature| JWTS
    AUG -->|2. check denylist| TDL
    AS -->|deny on logout/revoke| TDL
    AS --> REDIS
    AS --> DB
    AS -->|emit events| AEL

    style TDL fill:#ff6b6b,stroke:#c0392b,color:#fff
    style AUG fill:#3498db,stroke:#2980b9,color:#fff
    style JWTS fill:#2ecc71,stroke:#27ae60,color:#fff
    style AS fill:#9b59b6,stroke:#8e44ad,color:#fff
    style REDIS fill:#e67e22,stroke:#d35400,color:#fff
    style DB fill:#1abc9c,stroke:#16a085,color:#fff
```

## Performance Characteristics

| Operation | Where | Latency | Per-Request Cost |
|-----------|-------|---------|-----------------|
| JWT Verify | CPU (in-process) | ~0.1ms | ✅ None |
| Denylist Check | In-memory Map | ~0.001ms | ✅ None |
| Redis Session Lookup | Network | ~0.5-2ms | ❌ Only on `/refresh` |
| DB Session Lookup | Network | ~2-5ms | ❌ Only on `/refresh` fallback |

> [!TIP]
> The hot path (every protected request) stays **entirely in-process** — JWT signature check + Map lookup. No network I/O at all.

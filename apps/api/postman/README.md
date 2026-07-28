# Rufieltics API - Postman Collection

API collection for Rufieltics authentication: registration, login, OAuth (Google), two-factor, sessions, and lockout management.

## Import Instructions

1. Open Postman
2. Click **Import** button (top left)
3. Drag & drop `Auth_API.postman_collection.json` or click **Upload Files**
4. Import `Development.postman_environment.json` for the local environment
5. Collection will appear in your sidebar with organized folders

## Collection Structure

The collection is organized into these folders:

1. **Authentication** - Registration, login, email verification, sessions, sudo
2. **OAuth (Google)** - Sign in / sign up with Google (OpenID Connect)
3. **Two-Factor (TOTP)** - Authenticator enrolment, step-up, recovery codes
4. **Admin - Lockout Management** - View and clear verification lockouts
5. **Testing** - Test scenarios for validation and edge cases

## Variables

The collection uses these variables (already configured):

- `base_url`: `http://localhost:6001/api/v1` (API base URL)
- `verification_code`: `123456` (used in email verification)
- `access_token`: (auto-populated after login)
- `refresh_token`: (auto-populated after login)
- `step_up_challenge_id`: (auto-populated when a login requires step-up)
- `device_secret`: (auto-populated after login)
- `trusted_device_id`: (paste from `GET /auth/trusted-devices`)
- `oauth_code`, `oauth_state`: (only for manually replaying the Google callback)

Authenticated requests must send the **same `User-Agent`** the session was issued for, plus the `deviceSecret` cookie (or `X-Device-Secret` header) -- tokens are bound to the device fingerprint.

To change variables:

1. Right-click the collection → **Edit**
2. Go to **Variables** tab
3. Update values as needed

---

## Authentication Endpoints

### 1. **Register** (POST `/auth/register`)

Public endpoint for user registration. Creates a new user account with `isActive=false` and sends a 6-digit verification code to the email.

**Required fields:**

- `email` (valid email)
- `username` (min 3 chars)
- `password` (min 8 chars, must have uppercase, lowercase, number, special char)
- `name` (min 3 chars)

**Optional fields:**

- `phone` (E.164 format, e.g., +1234567890)
- `avatar` (valid URL)

**Response:**

```json
{
  "status": 201,
  "version": "v1",
  "timestamp": "2026-03-15T10:30:45.123Z",
  "message": "User created successfully",
  "data": {
    "id": 1,
    "email": "john.doe@example.com",
    "username": "johndoe",
    "isActive": false,
    ...
  }
}
```

**Note:** `isActive`, `isStaff`, and `isTwoFactorEnabled` cannot be set during registration.

---

### 2. **Verify Email** (POST `/auth/verify-email`)

Verify email address with the 6-digit code sent during registration.

**Request body:**

```json
{
  "email": "john.doe@example.com",
  "code": "123456"
}
```

**On success:**

- User's `isActive` is set to `true`
- `emailVerifiedAt` timestamp is updated
- User can now login

**Validation:**

- Code must be valid and not expired (15 minutes)
- Maximum 5 attempts allowed
- Rate limited per email

---

### 3. **Resend Verification Code** (POST `/auth/resend-verification`)

Resend a new verification code to the email. Previous codes are invalidated.

**Request body:**

```json
{
  "email": "john.doe@example.com"
}
```

**Rate limiting:** 3 requests per hour per email

---

### 4. **Login** (POST `/auth/login`)

Authenticate user and receive access tokens. Only active users (`isActive=true`) can login.

**Request body:**

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "status": 200,
  "version": "v1",
  "timestamp": "2026-03-15T10:30:45.123Z",
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": { ... }
  }
}
```

**Access token is automatically saved** to collection variable for authenticated requests.

**Risk-based step-up:** if the sign-in looks risky (new device / new location / impossible travel), the response instead contains no tokens and asks for an emailed one-time code:

```json
{
  "status": 200,
  "message": "Additional verification required. We've sent a code to your email.",
  "data": {
    "stepUpRequired": true,
    "challengeId": "f4624cd5-909c-4f8e-b29a-c3f8a3d6961b"
  }
}
```

The Login test script auto-saves `challengeId`; complete the sign-in with **Step Up (Verify OTP)** below.

---

### 5. **Step Up (Verify OTP)** (POST `/auth/login/step-up`)

Complete a risk-based step-up challenge and receive tokens. The OTP is emailed when `POST /auth/login` returns `stepUpRequired`. In development, view it in **Mailpit** at `http://localhost:8025`.

**Request body:**

```json
{
  "challengeId": "{{step_up_challenge_id}}",
  "code": "123456"
}
```

`challengeId` is auto-filled from the Login request; replace `code` with the value from the email. On success, tokens are set (access token saved to the collection variable). Wrong codes return `401` with the remaining attempts; after 5 the challenge is voided and you must sign in again.

---

### 6. **Sudo (Re-authenticate)** (POST `/auth/sudo`)

Proves identity again before a destructive action. Sensitive routes reject with `403` and `error.code = SUDO_REQUIRED` until this succeeds.

**Headers:** `Authorization: Bearer {access_token}`, `X-Device-Secret: {deviceSecret}`

**Request body:**

```json
{
  "method": "password",
  "password": "Password123!"
}
```

The grant lasts `SUDO_TTL_SECONDS` (default 300) and is bound to the **current session only** -- elevating on one device does not elevate another. It is dropped when the session is revoked. Five failed attempts lock elevation for that session. `GET /auth/sudo` returns `{ active, expiresIn }` so the UI can prompt before showing a risky form.

Sudo-guarded routes: `POST /auth/password`, `DELETE /auth/trusted-devices/:id`, `DELETE /auth/sessions`, `DELETE /auth/sessions/others`.

---

### 7. **Change Password** (POST `/auth/password`)

Requires sudo.

**Request body:**

```json
{
  "password": "NewPassword123!"
}
```

Rejects reuse of the current password or the last five, signs out every other device, untrusts those browsers, consumes the sudo grant, and emails the owner. Reuse returns `400`; missing sudo returns `403`.

---

### 8. **Logout** (POST `/auth/logout`)

Logout and invalidate current session/token.

**Headers:** `Authorization: Bearer {access_token}`

---

### 9. **Forgot Password** (POST `/auth/forgot-password`)

Public. Starts account recovery. **Enumeration-safe** — always returns the same generic success whether or not the email exists. When it does, a **single-use cryptographic token** (256-bit, stored only as a SHA-256 hash, short TTL) is emailed. In dev, read it from **Mailpit** (`http://localhost:8025`) and copy into `{{reset_token}}`. Rate-limited like login.

**Request body:**

```json
{ "email": "john.doe@example.com" }
```

---

### 10. **Reset Password** (POST `/auth/reset-password`)

Public. Consumes the token from the reset email, sets the new password, and **revokes all sessions**. Also lets an OAuth-only user set a first password. Reuse of a recent password is rejected; an invalid/expired token returns a generic error.

**Request body:**

```json
{ "token": "{{reset_token}}", "password": "NewSecurePass123!" }
```

---

### 11. **Request Email Change** (POST `/auth/email/change`)

Requires **sudo**. Emails a 6-digit confirmation code to the **new** address (Mailpit) and rejects an address already in use. Run **Sudo (Re-authenticate)** first.

**Headers:** `Authorization: Bearer {access_token}`, `X-Device-Secret: {device_secret}`

**Request body:**

```json
{ "newEmail": "new.address@example.com" }
```

---

### 12. **Confirm Email Change** (POST `/auth/email/change/confirm`)

Confirms the code sent to the new address and updates the account email (marked verified). Attempt-capped and single-use.

**Request body:**

```json
{ "code": "123456" }
```

---

## OAuth (Google) Endpoints

Sign in / sign up with Google using OpenID Connect (**authorization-code + PKCE**, verified server-side). These are **browser-driven redirects**, not JSON APIs — trigger them from a real browser, not from Postman's request runner. One button serves both sign-in and sign-up; the callback decides create-vs-login.

**Setup:** set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on the API, and register `GOOGLE_REDIRECT_URI` (`http://localhost:6001/api/v1/auth/oauth/google/callback`) as an authorized redirect URI in the Google Cloud console. When `GOOGLE_CLIENT_ID` is unset the endpoints are disabled.

### 1. **Google Sign-in (Redirect)** (GET `/auth/oauth/google`)

Starts the login. Responds `302` to Google's consent screen and stores a short-lived CSRF `state` + PKCE verifier in Redis. Open this URL in a browser.

### 2. **Google Callback** (GET `/auth/oauth/google/callback`)

Google redirects here after consent. The server verifies `state`, exchanges the code, then **resolves or creates** the user:

- **New user** → creates a `User` (no password, email pre-verified) + an `OAuthAccount` link, then a session.
- **Returning user** → finds the `OAuthAccount` by Google's subject id and issues a session.
- **Collision** (email already has a password account) → auto-links Google **only when `email_verified` is true**. If that local account had never verified its email, its unproven password is discarded to prevent pre-registration takeover.
- **Unverified Google email** → refused.

On success it sets httpOnly `refreshToken` + `deviceSecret` cookies and `302`s to the web app (`OAUTH_SUCCESS_REDIRECT`); on failure it `302`s to `OAUTH_FAILURE_REDIRECT`. The web callback page trades the refresh cookie for an access token via `POST /auth/refresh`.

**Note:** a Google-only user has no password. Submitting the password login form for that email returns the generic `invalid_credentials` (by design, to avoid leaking the account's existence or provider).

---

## Testing Endpoints

### 1. **Test Indonesian Language (Validation Error)**

Tests validation error messages in Indonesian by sending invalid data with `Accept-Language: id` header.

**Expected:** All validation errors translated to Bahasa Indonesia.

---

### 2. **Test Email Verification - Invalid Code**

Tests verification with invalid code. Should return appropriate error message.

---

### 3. **Test Login - Unverified Account**

Tests login attempt with unverified account (`isActive=false`). Should return error indicating account needs verification.

---

## Language Support

All endpoints support internationalization via:

- `Accept-Language` header (`en` or `id`)
- `x-lang` header (alternative)
- `?lang=` query parameter

---

## Response Format

### Success Response

```json
{
  "status": 200,
  "version": "v1",
  "timestamp": "2026-03-15T10:30:45.123Z",
  "message": "Success message",
  "data": { ... }
}
```

### Error Response

```json
{
  "status": 401,
  "version": "v1",
  "timestamp": "2026-03-15T10:30:45.123Z",
  "error": {
    "message": "Invalid credentials",
    "details": { ... }
  },
  "path": "/api/v1/auth/login"
}
```

### Validation Error Response

```json
{
  "status": 422,
  "version": "v1",
  "timestamp": "2026-03-15T10:30:45.123Z",
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email must be a valid email address",
        "code": "invalid_string"
      }
    ]
  },
  "path": "/api/v1/auth/register"
}
```

---

## Testing Workflow

### Complete Registration & Verification Flow

1. **Register User** → POST `/auth/register`
   - Check your email (Mailpit at `http://localhost:8025`) for the 6-digit code

2. **Verify Email** → POST `/auth/verify-email`
   - Use email and code from step 1
   - User's `isActive` becomes `true`

3. **Login** → POST `/auth/login`
   - Use email and password
   - Access token is saved automatically (or complete step-up if prompted)

4. **Access Protected Resources** → Any authenticated endpoint
   - Token is automatically included in requests

### Google Sign-in Flow

1. Open `{{base_url}}/auth/oauth/google` in a browser
2. Complete the Google consent screen
3. You are redirected to the web app, signed in (no password)

### Testing Different Scenarios

- **Invalid registration data** → Use "Test Indonesian Language" request
- **Invalid verification code** → Use "Test Email Verification - Invalid Code"
- **Login before verification** → Use "Test Login - Unverified Account"
- **Resend code** → Use "Resend Verification Code" after registration

---

## Validation Rules

- **Email**: Must be valid email format
- **Username**: Min 3 characters
- **Password**: Min 8 characters, must contain:
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character
- **Phone**: E.164 format (e.g., `+1234567890`)
- **Avatar**: Must be valid URL

## Database

Ensure PostgreSQL and Redis are running before testing:

```bash
docker compose up -d postgres redis
```

Default connection: `postgresql://root:root123@localhost:5432/rufieltics_db`

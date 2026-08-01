# Email Verification Flow - Implementation Notes

## Current State

✅ **User Registration** - Users are created with `isActive: false`
✅ **Database Schema** - Has `emailVerifiedAt` field ready

## To Implement

### 1. Email Verification Code Storage

Add a table to store verification codes:

```prisma
model EmailVerificationCode {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  code      String   // 6-digit code
  expiresAt DateTime // Valid for 15 minutes
  createdAt DateTime @default(now())
  used      Boolean  @default(false)

  @@index([userId])
  @@index([code])
  @@schema("user")
}
```

### 2. Create Verification Endpoint

**POST** `/auth/verify-email`

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Logic:**

1. Find user by email
2. Check if code exists, matches, and hasn't expired
3. If valid:
   - Set `user.isActive = true`
   - Set `user.emailVerifiedAt = now()`
   - Mark code as `used = true`
4. Return success or error

### 3. Resend Verification Code

**POST** `/auth/resend-verification`

```json
{
  "email": "user@example.com"
}
```

**Logic:**

1. Check if user exists and is not already verified
2. Invalidate old codes
3. Generate new 6-digit code
4. Store in database with 15min expiry
5. Send email (use email service)
6. Return success

### 4. Email Service Integration

Options:

- **SendGrid**
- **AWS SES**
- **Mailgun**
- **Resend**

Template:

```
Subject: Verify your email

Your verification code is: 123456

This code will expire in 15 minutes.
```

### 5. Update User Creation Flow

In `users.service.ts` `create()` method:

```typescript
async create(data: CreateUserDto) {
  const user = await createUser({...})

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString()

  // Store code in database
  await createVerificationCode({
    userId: user.id,
    code,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  })

  // Send verification email
  await emailService.sendVerificationCode(user.email, code)

  return user
}
```

### 6. Guard Protected Routes

Create a guard that checks `isActive`:

```typescript
@Injectable()
export class ActiveUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const user = request.user // from JWT/session

    if (!user.isActive) {
      throw new ForbiddenException('Please verify your email first')
    }

    return true
  }
}
```

Apply to routes:

```typescript
@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Get('protected-route')
```

### 7. Testing Flow

1. **POST** `/users` → Creates user with `isActive: false`
2. Check email for 6-digit code
3. **POST** `/auth/verify-email` with code
4. **POST** `/auth/login` → Now allowed
5. **GET** `/users/:id` → Shows `isActive: true`, `emailVerifiedAt: "2026-03-15T..."`

## Security Considerations

- ✅ Rate limit verification attempts (max 5 per 15 minutes)
- ✅ Rate limit resend requests (max 3 per hour)
- ✅ Delete expired codes after 24 hours (cron job)
- ✅ Use HTTPS only
- ✅ Log all verification attempts for audit
- ✅ Consider adding IP tracking to detect abuse

## Alternative: Email Token Link

Instead of 6-digit code, use a unique token in email link:

**Email:**

```
Click to verify: https://yourapp.com/verify?token=abc123xyz...
```

**Pros:**

- One-click verification (better UX)
- No typing errors

**Cons:**

- Token can be intercepted if forwarded
- Less secure than TOTP-style codes

Choose based on your security requirements.

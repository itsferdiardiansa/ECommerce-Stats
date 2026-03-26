# Rufieltics API - Postman Collection

Complete API collection for Rufieltics application including Authentication and User Management endpoints.

## Import Instructions

1. Open Postman
2. Click **Import** button (top left)
3. Drag & drop `Rufieltics_API.postman_collection.json` or click **Upload Files**
4. Collection will appear in your sidebar with organized folders

## Collection Structure

The collection is organized into three main folders:

1. **Authentication** - Registration, login, email verification
2. **User Management** - CRUD operations for users (admin/self access)
3. **Testing** - Test scenarios for validation and edge cases

## Variables

The collection uses these variables (already configured):

- `base_url`: `http://localhost:6001/api/v1` (API base URL)
- `user_id`: `1` (used in user management endpoints)
- `verification_code`: `123456` (used in email verification)
- `access_token`: (auto-populated after login)

To change variables:

1. Right-click the collection → **Edit**
2. Go to **Variables** tab
3. Update values as needed

---

## 🔐 Authentication Endpoints

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

---

### 5. **Logout** (POST `/auth/logout`)

Logout and invalidate current session/token.

**Headers:** `Authorization: Bearer {access_token}`

---

## 👥 User Management Endpoints

These endpoints are typically restricted to admin users or the user themselves (self-access).

### 1. **List All Users (Basic)** (GET `/users`)

List users with pagination.

**Query params:**

- `page` (default: 1)
- `limit` (default: 10, max: 100)

**Response:**

```json
{
  "status": 200,
  "version": "v1",
  "timestamp": "2026-03-15T10:30:45.123Z",
  "message": "Success",
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

---

### 2. **List Users (With Search)** (GET `/users?search=john`)

Search across name, email, and username fields.

**Query params:**

- `search` (searches in name/email/username fields)
- Standard pagination params

---

### 3. **List Users (With Filters)** (GET `/users`)

Filter by multiple user attributes.

**Available filters:**

- `email` (partial match, case-insensitive)
- `name` (partial match, case-insensitive)
- `isActive` (`true`/`false`)
- `isStaff` (`true`/`false`)
- `isTwoFactorEnabled` (`true`/`false`)
- `marketingOptIn` (`true`/`false`)
- `tierLevel` (`BASIC`, `PRO`, `PREMIUM`)

**Example:**

```
GET /users?isActive=true&tierLevel=PRO&page=1&limit=10
```

---

### 4. **List Users (With Sorting)** (GET `/users`)

Sort results by specific fields.

**Query params:**

- `sortBy`: `createdAt`, `updatedAt`, `email`, `name`, `username`, `lastLoginAt`
- `sortOrder`: `asc` or `desc`

**Example:**

```
GET /users?sortBy=createdAt&sortOrder=desc
```

---

### 5. **List Users (Include Deleted)** (GET `/users?includeDeleted=true`)

By default, the list endpoint excludes soft-deleted users. Use this query parameter to include them in results.

**Query params:**

- `includeDeleted`: `true` (includes soft-deleted users)
- All other filters and pagination params work as normal

**Example:**

```
GET /users?includeDeleted=true&page=1&limit=10
```

**Response includes deleted users:**

```json
{
  "status": 200,
  "data": {
    "items": [
      {
        "id": 2,
        "email": "deleted@example.com",
        "isActive": false,
        "deletedAt": "2026-03-15T16:04:31.610Z",
        ...
      }
    ]
  }
}
```

**How to identify deleted users:** Check if `deletedAt` field is not `null`.

---

### 6. **Get User by ID** (GET `/users/:id`)

Retrieve detailed information for a specific user.

**Note:** This endpoint only returns active (non-deleted) users. Deleted users will return 404.

---

### 7. **Update User** (PUT `/users/:id`)

Update user information. All fields are optional.

**Updatable fields:**

- `email`, `username`, `name`, `password`
- `avatar`, `phone`
- `isActive`, `isStaff`, `isTwoFactorEnabled`

**Note:** When updating password, `passwordChangedAt` is automatically set.

---

### 8. **Delete User** (DELETE `/users/:id`)

**Soft delete** - Sets `deletedAt` timestamp and deactivates the user. The record remains in the database for audit and referential integrity.

**Behavior:**

- User's `deletedAt` is set to current timestamp
- User's `isActive` is set to `false`
- User is excluded from default list/search queries
- Related data (orders, reviews) remains intact
- Operation is **idempotent** - calling DELETE multiple times returns success

**Response:**

```json
{
  "status": 200,
  "message": "User deleted successfully",
  "data": {
    "id": 2,
    "deletedAt": "2026-03-15T16:04:31.610Z",
    "isActive": false,
    ...
  }
}
```

**To view deleted users:** Use `GET /users?includeDeleted=true`

---

### 9. **Create User (Admin)** (POST `/users`)

Admin endpoint to create users directly, bypassing the registration flow. User will still be created with `isActive=false` unless explicitly set.

---

## 🧪 Testing Endpoints

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
  "status": 404,
  "version": "v1",
  "timestamp": "2026-03-15T10:30:45.123Z",
  "error": {
    "message": "User not found",
    "details": { ... }
  },
  "path": "/api/v1/users/999"
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
   - Save the `user_id` from response
   - Check your email for 6-digit code

2. **Verify Email** → POST `/auth/verify-email`
   - Use email and code from step 1
   - User's `isActive` becomes `true`

3. **Login** → POST `/auth/login`
   - Use email and password
   - Access token is saved automatically

4. **Access Protected Resources** → Any authenticated endpoint
   - Token is automatically included in requests

### Testing Different Scenarios

- **Invalid registration data** → Use "Test Indonesian Language" request
- **Invalid verification code** → Use "Test Email Verification - Invalid Code"
- **Login before verification** → Use "Test Login - Unverified Account"
- **Resend code** → Use "Resend Verification Code" after registration

---

## API Architecture

### Authentication vs User Management

**`/auth/*` endpoints** (Public or authenticated):

- Registration, login, logout
- Email verification (public)
- Password reset (public)
- Token refresh

**`/users/*` endpoints** (Admin or self-only):

- User CRUD operations
- List/search/filter users (admin)
- Update user details (admin or self)
- Admin user creation

This separation provides:

- ✅ Clear security boundaries
- ✅ Different rate limiting per namespace
- ✅ Better API organization
- ✅ Easier permission management
- `?lang=en` query parameter

## Example Responses

### Success (Create User)

```json
{
  "message": "User created successfully",
  "data": {
    "id": 1,
    "email": "john.doe@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "isActive": true,
    "createdAt": "2026-03-15T10:30:00.000Z"
  }
}
```

### Success (List Users)

```json
{
  "message": "Success",
  "data": [...],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### Validation Error (422)

```json
{
  "statusCode": 422,
  "timestamp": "2026-03-15T10:35:00.123Z",
  "path": "/api/v1/users",
  "error": "Unprocessable Entity",
  "message": [
    {
      "code": "invalid_format",
      "message": "Email Address must be a valid email address",
      "path": ["email"]
    },
    {
      "code": "too_small",
      "message": "Password must be at least 8 characters long",
      "path": ["password"]
    }
  ]
}
```

### Not Found (404)

```json
{
  "statusCode": 404,
  "timestamp": "2026-03-15T10:40:00.123Z",
  "path": "/api/v1/users/999",
  "error": "Resource not found",
  "message": "Resource not found"
}
```

## Tips

1. **Create a user first** before testing GET/PUT/DELETE by ID
2. **Save the returned user ID** to the `user_id` collection variable
3. **Try different languages** by changing the `Accept-Language` header
4. **Combine filters** for advanced queries (e.g., `?isActive=true&tierLevel=PRO&sortBy=createdAt`)
5. **Use search OR specific filters**, not both (search uses OR logic across fields, filters use AND)

## Testing Workflow

### Registration & Verification Flow

1. **POST** `/users` → Create new user (starts with `isActive: false`)
2. **(Future)** User receives 6-digit verification code via email
3. **(Future)** **POST** `/auth/verify-email` → Verify code, sets `isActive: true` and `emailVerifiedAt: now()`
4. User can now log in and access the system

### Standard CRUD Testing

1. **POST** `/users` → Create test users
2. **GET** `/users` → List all users, note pagination
3. **GET** `/users?search=john` → Test search
4. **GET** `/users?isActive=true&tierLevel=PRO` → Test filters
5. **GET** `/users/:id` → Get specific user details
6. **PUT** `/users/:id` → Update user data
7. **DELETE** `/users/:id` → Remove user

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

Ensure PostgreSQL is running before testing:

```bash
docker compose up -d postgres
```

Default connection: `postgresql://root:root123@localhost:5432/rufieltics_db`

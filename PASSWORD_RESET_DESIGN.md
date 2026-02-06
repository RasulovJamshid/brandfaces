# Password Reset via Telegram Bot - Design Document

## Overview
This document outlines the design for implementing password reset functionality for admin users through the Telegram bot integration.

## Use Case
Admin users who forget their dashboard password can request a password reset through the Telegram bot instead of requiring another admin to manually reset it.

## Architecture

### 1. Database Schema Changes
Add new table for password reset tokens:

```prisma
model PasswordResetToken {
  id          Int      @id @default(autoincrement())
  adminId     Int
  admin       Admin    @relation(fields: [adminId], references: [id], onDelete: Cascade)
  token       String   @unique
  telegramId  String
  expiresAt   DateTime
  used        Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

### 2. Telegram Bot Commands

#### `/resetpassword` or `/forgot`
- **Purpose**: Initiate password reset process
- **Flow**:
  1. User sends `/resetpassword` to the bot
  2. Bot asks for admin email address
  3. User provides email
  4. Bot validates:
     - Email exists in admin table
     - Telegram ID is linked to that admin account
  5. If valid:
     - Generate secure random token (UUID)
     - Store token in database with 15-minute expiration
     - Send reset link to user: `http://dashboard.url/reset-password?token=<token>`
  6. If invalid:
     - Show error message
     - Suggest contacting super admin

#### `/linkaccount`
- **Purpose**: Link Telegram account to admin email (one-time setup)
- **Flow**:
  1. User sends `/linkaccount`
  2. Bot asks for email and temporary verification code
  3. Admin generates code from dashboard
  4. Bot verifies code and links Telegram ID to admin account

### 3. Backend API Endpoints

#### `POST /auth/request-reset`
- **Input**: `{ email: string, telegramId: string }`
- **Process**:
  - Verify admin exists with this email
  - Verify Telegram ID matches admin record
  - Generate token
  - Store in database
  - Return success/error
- **Response**: `{ success: boolean, message: string }`

#### `POST /auth/reset-password`
- **Input**: `{ token: string, newPassword: string }`
- **Process**:
  - Validate token exists and not expired
  - Validate token not already used
  - Hash new password
  - Update admin password
  - Mark token as used
  - Log activity
- **Response**: `{ success: boolean, message: string }`

#### `POST /auth/verify-reset-token`
- **Input**: `{ token: string }`
- **Process**:
  - Check if token is valid and not expired
- **Response**: `{ valid: boolean, email: string }`

### 4. Frontend Components

#### Password Reset Page (`/reset-password`)
- **Route**: `/reset-password?token=<token>`
- **Features**:
  - Token validation on page load
  - New password input (with strength indicator)
  - Confirm password input
  - Submit button
  - Success/error messages
  - Redirect to login after successful reset

#### Admin Profile Settings
- **Add section**: "Telegram Integration"
- **Features**:
  - Display linked Telegram ID (if any)
  - Generate verification code for linking
  - Unlink Telegram account button
  - Instructions for using `/linkaccount` command

### 5. Security Considerations

1. **Token Security**:
   - Use cryptographically secure random tokens (UUID v4)
   - Tokens expire after 15 minutes
   - One-time use only
   - Stored hashed in database

2. **Rate Limiting**:
   - Max 3 reset requests per email per hour
   - Max 5 reset requests per Telegram ID per hour

3. **Verification**:
   - Require both email AND Telegram ID match
   - Telegram ID must be pre-linked to admin account

4. **Logging**:
   - Log all password reset attempts (success and failure)
   - Log Telegram ID linking/unlinking
   - Alert super admins of suspicious activity

### 6. Implementation Steps

#### Phase 1: Database & Backend
1. Add `telegramId` field to Admin model
2. Create PasswordResetToken model
3. Run Prisma migration
4. Implement auth endpoints
5. Add rate limiting middleware
6. Add activity logging

#### Phase 2: Telegram Bot
1. Add `/linkaccount` command handler
2. Add `/resetpassword` command handler
3. Implement conversation flow for email input
4. Add error handling and user feedback

#### Phase 3: Frontend
1. Create reset password page
2. Add Telegram integration section to admin profile
3. Add verification code generation
4. Add success/error notifications

#### Phase 4: Testing
1. Test happy path: successful reset
2. Test expired tokens
3. Test invalid tokens
4. Test unlinked accounts
5. Test rate limiting
6. Security testing

### 7. Alternative: Email-Based Reset (Simpler)

If Telegram integration is complex, consider traditional email-based reset:

1. Admin clicks "Forgot Password" on login page
2. Enters email address
3. System sends reset link to email
4. Admin clicks link and sets new password

**Pros**:
- Standard implementation
- No Telegram dependency
- Easier to implement

**Cons**:
- Requires email server configuration
- Slower than Telegram bot
- Email might go to spam

### 8. Recommended Approach

**For MVP**: Implement email-based password reset first (simpler, standard)

**For Future Enhancement**: Add Telegram bot integration as an additional option

### 9. Email-Based Implementation (Quick Start)

#### Backend:
```typescript
// Install nodemailer
npm install nodemailer @types/nodemailer

// Create email service
class EmailService {
  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    // Send email with reset link
  }
}
```

#### Frontend:
```typescript
// Forgot Password Page
<TextField label="Email" />
<Button onClick={handleRequestReset}>Send Reset Link</Button>

// Reset Password Page
<TextField label="New Password" type="password" />
<TextField label="Confirm Password" type="password" />
<Button onClick={handleResetPassword}>Reset Password</Button>
```

## Conclusion

The password reset feature can be implemented in two ways:
1. **Telegram Bot Integration** - More complex, requires account linking
2. **Email-Based Reset** - Simpler, industry standard

**Recommendation**: Start with email-based reset for immediate functionality, then add Telegram integration as an enhancement if needed.

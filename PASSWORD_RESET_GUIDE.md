# Password Reset via Telegram Bot - User Guide

## Overview
Admins can reset their dashboard passwords securely through the Telegram bot. This feature requires linking your Telegram account to your admin account first.

---

## 🔗 Step 1: Link Your Telegram Account

### From Dashboard:
1. Log in to the admin dashboard
2. Go to **Admin Management** → Click your profile
3. Click **"Generate Verification Code"**
4. A 6-character code will be displayed (valid for 10 minutes)
5. Copy the code

### From Telegram Bot:
1. Open the Casting Platform bot on Telegram
2. Send command: `/linkaccount`
3. Bot will ask for the verification code
4. Paste the 6-character code from dashboard
5. Bot confirms account is linked ✅

**Security Note**: Each verification code expires after 10 minutes and can only be used once.

---

## 🔐 Step 2: Reset Your Password

### When You Forget Your Password:

1. **Open Telegram Bot**
   - Find the Casting Platform bot
   - Send command: `/resetpassword`

2. **Provide Your Email**
   - Bot asks: "Please enter your admin email address"
   - Reply with your email (e.g., `admin@example.com`)

3. **Verification**
   - Bot verifies:
     - Email exists in system
     - Telegram account is linked to this email
     - Account is active

4. **Receive Reset Link**
   - Bot sends a secure reset link
   - Link format: `http://dashboard.url/reset-password?token=xxxxx`
   - **Valid for 15 minutes only**

5. **Reset Password**
   - Click the link (opens in browser)
   - Enter new password (minimum 6 characters)
   - Confirm new password
   - Click "Reset Password"

6. **Success!**
   - Password updated
   - Automatically redirected to login page
   - Use new password to log in

---

## 🛡️ Security Features

### Rate Limiting
- **Maximum 3 reset requests per hour** per admin account
- Prevents brute force attacks
- If limit exceeded: "Too many reset requests. Please try again later."

### Token Security
- Each reset token is **cryptographically secure** (64 characters)
- Tokens **expire after 15 minutes**
- Tokens are **one-time use only**
- Used tokens cannot be reused

### Account Verification
- Requires **both email AND Telegram ID** to match
- Only works for **active admin accounts**
- Telegram account must be **pre-linked**

### Activity Logging
- All password resets are logged
- Includes timestamp and method (via Telegram)
- Visible in admin activity logs

---

## 📋 API Endpoints

### For Dashboard Integration:

#### Generate Verification Code
```http
POST /auth/generate-verification-code
Body: { "adminId": 1 }
Response: { "code": "A1B2C3", "expiresIn": "10 minutes" }
```

#### Link Telegram Account (Called by Bot)
```http
POST /auth/link-telegram
Body: {
  "verificationCode": "A1B2C3",
  "telegramId": "123456789",
  "telegramUsername": "johndoe"
}
```

#### Request Password Reset (Called by Bot)
```http
POST /auth/request-reset
Body: {
  "email": "admin@example.com",
  "telegramId": "123456789"
}
Response: {
  "success": true,
  "resetUrl": "http://localhost:5173/reset-password?token=xxxxx",
  "expiresIn": "15 minutes"
}
```

#### Verify Reset Token
```http
GET /auth/verify-reset-token?token=xxxxx
Response: {
  "valid": true,
  "email": "admin@example.com"
}
```

#### Reset Password
```http
POST /auth/reset-password
Body: {
  "token": "xxxxx",
  "newPassword": "newSecurePassword123"
}
Response: {
  "success": true,
  "message": "Password reset successfully"
}
```

#### Unlink Telegram Account
```http
POST /auth/unlink-telegram
Body: { "adminId": 1 }
```

---

## 🤖 Telegram Bot Commands

### `/linkaccount`
Links your Telegram account to your admin dashboard account.

**Usage:**
```
User: /linkaccount
Bot: Please enter your 6-character verification code from the dashboard.
User: A1B2C3
Bot: ✅ Your Telegram account has been successfully linked to admin@example.com
```

### `/resetpassword`
Initiates password reset process.

**Usage:**
```
User: /resetpassword
Bot: Please enter your admin email address.
User: admin@example.com
Bot: ✅ Password reset link sent!
     Click here to reset your password: [LINK]
     This link will expire in 15 minutes.
```

### `/unlinkaccount`
Unlinks your Telegram account from dashboard.

**Usage:**
```
User: /unlinkaccount
Bot: Are you sure you want to unlink your account? (yes/no)
User: yes
Bot: ✅ Your Telegram account has been unlinked.
```

---

## ⚠️ Troubleshooting

### "Invalid or expired verification code"
- **Cause**: Code expired (>10 minutes) or already used
- **Solution**: Generate a new code from dashboard

### "This Telegram account is already linked to another admin"
- **Cause**: Telegram ID is linked to different admin account
- **Solution**: Unlink from other account first, or use different Telegram account

### "No active admin found with this email and Telegram account"
- **Cause**: Email doesn't match linked Telegram account
- **Solution**: Verify you're using the correct email address

### "Too many reset requests"
- **Cause**: Exceeded 3 requests per hour limit
- **Solution**: Wait 1 hour before trying again

### "Reset token has expired"
- **Cause**: More than 15 minutes passed since link was generated
- **Solution**: Request a new reset link via Telegram bot

### "This reset token has already been used"
- **Cause**: Token was already used to reset password
- **Solution**: If you need to reset again, request a new link

---

## 🔒 Best Practices

1. **Link Account Immediately**
   - Link your Telegram account as soon as you create your admin account
   - Don't wait until you forget your password

2. **Keep Telegram Secure**
   - Enable two-factor authentication on Telegram
   - Don't share your Telegram account

3. **Use Strong Passwords**
   - Minimum 6 characters (recommended: 12+)
   - Mix of letters, numbers, and symbols
   - Don't reuse passwords

4. **Act Quickly**
   - Reset links expire in 15 minutes
   - Don't delay when you receive the link

5. **Verify Links**
   - Always check the URL before entering password
   - Should start with your dashboard domain

---

## 📊 Database Schema

### Admin Table
```sql
CREATE TABLE "Admin" (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role "AdminRole" DEFAULT 'ADMIN',
  isActive BOOLEAN DEFAULT true,
  telegramId TEXT UNIQUE,           -- Linked Telegram ID
  telegramUsername TEXT,             -- Telegram username
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL
);
```

### PasswordResetToken Table
```sql
CREATE TABLE "PasswordResetToken" (
  id SERIAL PRIMARY KEY,
  adminId INTEGER REFERENCES "Admin"(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Summary

**Password Reset Flow:**
1. Link Telegram account (one-time setup)
2. Send `/resetpassword` to bot
3. Provide email address
4. Click reset link from bot
5. Enter new password
6. Login with new password

**Security:**
- ✅ Secure tokens (64-character random)
- ✅ Time-limited (15 minutes)
- ✅ One-time use
- ✅ Rate limited (3/hour)
- ✅ Requires account linking
- ✅ Activity logging

**Support:**
- If you can't reset via Telegram, contact a Super Admin
- Super Admins can manually reset passwords from Admin Management page

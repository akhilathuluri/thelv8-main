# OTP Verification System - Setup Guide

## Overview
This modular OTP verification system adds email verification to the signup process without modifying the core authentication structure.

## Features
- ✅ 6-digit OTP generation
- ✅ Email delivery via Resend
- ✅ 10-minute expiration
- ✅ Max 5 verification attempts
- ✅ Resend OTP functionality
- ✅ Beautiful email templates
- ✅ Rate limiting protection
- ✅ IP and User-Agent tracking
- ✅ Modular and independent design

## Installation Steps

### 1. Run Database Migration

Connect to your Supabase project and run the migration:

```bash
# Using Supabase CLI
supabase migration up

# Or manually execute the SQL file
# migrations/009_add_otp_verification.sql
```

This creates:
- `otp_verifications` table
- `generate_otp()` function
- `verify_otp()` function
- `cleanup_expired_otps()` function
- `email_verified` column in profiles table

### 2. Configure Environment Variables

Ensure your `.env.local` file has the following (see `.env.example`):

```env
# Required for OTP emails
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=The LV8 <orders@thelv8.com>
EMAIL_REPLY_TO=support@thelv8.com

# Required for Supabase admin operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Test the System

1. **Navigate to your site**
2. **Click "Sign Up"**
3. **Enter user details** (name, email, password)
4. **Click "Continue with Email Verification"**
5. **Check your email** for the 6-digit OTP
6. **Enter OTP** in the verification form
7. **Account created!**

## Architecture

### Database Schema

```sql
otp_verifications
├── id (UUID)
├── email (TEXT)
├── otp_code (VARCHAR(6))
├── purpose (signup|password_reset|login)
├── verified (BOOLEAN)
├── attempts (INTEGER)
├── max_attempts (INTEGER)
├── expires_at (TIMESTAMP)
├── created_at (TIMESTAMP)
├── verified_at (TIMESTAMP)
├── ip_address (TEXT)
└── user_agent (TEXT)
```

### Service Layer

**`services/otp.service.ts`**
- `generateOTP()` - Creates and stores OTP
- `verifyOTP()` - Validates OTP code
- `getLatestOTP()` - Retrieves OTP for email
- `hasValidOTP()` - Checks if valid OTP exists
- `markEmailVerified()` - Updates profile
- `cleanupExpiredOTPs()` - Removes old records

### API Routes

**`/api/auth/send-otp`** (POST)
```json
{
  "email": "user@example.com",
  "purpose": "signup"
}
```

**`/api/auth/verify-otp`** (POST)
```json
{
  "email": "user@example.com",
  "otpCode": "123456",
  "purpose": "signup"
}
```

### UI Components

**`components/auth/SignupModal.tsx`**
- Two-step signup flow
- Step 1: User details + password
- Step 2: OTP verification
- Resend OTP functionality
- Loading states
- Error handling

## Security Features

1. **Rate Limiting**: Max 5 attempts per OTP
2. **Time-Based Expiry**: 10-minute window
3. **One-Time Use**: OTP marked as used after verification
4. **Secure Storage**: Server-side only (no client access)
5. **IP Tracking**: Logs IP address and user agent
6. **Auto Cleanup**: Removes expired OTPs automatically

## Email Template

Beautiful, responsive HTML email with:
- Gradient design matching thelv8 branding
- Large, readable OTP display
- Expiration warning
- Security tips
- Mobile-friendly layout

## Usage in Other Modules

### Password Reset (Future)
```typescript
// Send OTP for password reset
await otpService.generateOTP(email, 'password_reset');

// In email, get OTP
const otp = await otpService.getLatestOTP(email, 'password_reset');
await emailService.sendOTPEmail({
  to: email,
  otpCode: otp,
  purpose: 'password_reset'
});
```

### Login Verification (Future)
```typescript
// Two-factor authentication
await otpService.generateOTP(email, 'login');
```

## Maintenance

### Cleanup Expired OTPs

Run this periodically (daily recommended):

```sql
SELECT cleanup_expired_otps();
```

Or set up a Supabase cron job:
```sql
-- In Supabase Dashboard > Database > Cron Jobs
SELECT cron.schedule(
  'cleanup-expired-otps',
  '0 2 * * *', -- Run at 2 AM daily
  $$SELECT cleanup_expired_otps();$$
);
```

## Troubleshooting

### OTP Email Not Received
1. Check `RESEND_API_KEY` is set correctly
2. Verify email domain is configured in Resend
3. Check spam/junk folder
4. Check Resend dashboard for delivery status

### "Invalid OTP" Error
1. OTP may have expired (10 min limit)
2. Max attempts exceeded (5 tries)
3. OTP already used
4. Wrong email/purpose combination

### Database Errors
1. Ensure migration is applied: `supabase migration up`
2. Check RLS policies are enabled
3. Verify service role key has proper permissions

## Benefits of This Implementation

✅ **Modular**: Completely separate from core auth  
✅ **Reusable**: Can be used for password reset, 2FA, etc.  
✅ **Secure**: Server-side verification, rate limiting  
✅ **User-Friendly**: Clear UI, resend functionality  
✅ **Scalable**: Database functions handle concurrency  
✅ **Maintainable**: Well-documented, clean code  
✅ **Production-Ready**: Error handling, logging, validation  

## Future Enhancements

- [ ] SMS OTP option (Twilio integration)
- [ ] Remember device functionality
- [ ] Admin dashboard for OTP analytics
- [ ] Webhook notifications for suspicious activity
- [ ] Multi-language email templates
- [ ] Custom OTP length configuration
- [ ] Backup codes for account recovery

## Support

For issues or questions:
- Create an issue in the repository
- Check Supabase logs for database errors
- Review Resend dashboard for email delivery
- Check browser console for API errors

---

**Last Updated**: January 5, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅

# Supabase Auth Security Configuration

## Steps to Fix Auth Security Warnings

### 1. Fix Auth OTP Long Expiry
Go to Supabase Dashboard → Authentication → Settings → Auth → Email

**Change these settings:**
- **Email OTP expiry**: Change from default (3600 seconds) to `600` seconds (10 minutes)
- **SMS OTP expiry**: Change from default (3600 seconds) to `300` seconds (5 minutes)

### 2. Enable Leaked Password Protection
Go to Supabase Dashboard → Authentication → Settings → Auth → Security

**Enable:**
- ✅ **Leaked Password Protection**: Turn this ON
- ✅ **CAPTCHA Protection**: Turn this ON (optional but recommended)

### 3. Configure Email Templates (Security Best Practice)
Go to Supabase Dashboard → Authentication → Settings → Email Templates

**Update these templates for better security:**

#### Confirm Signup Template:
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
<p>This link expires in {{ .EmailOTPExpiresIn }} minutes.</p>
```

#### Reset Password Template:
```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link expires in {{ .EmailOTPExpiresIn }} minutes.</p>
```

### 4. URL Configuration (CRITICAL for Production)
Go to Supabase Dashboard → Authentication → Settings → URL Configuration

**Add your production URLs:**
- **Site URL**: `https://kly-ro.xyz`
- **Redirect URLs**: 
  - `https://kly-ro.xyz/auth/callback` (for production)
  - `https://kly-ro.xyz/dashboard` (for production)
  - `http://localhost:3000/auth/callback` (for development)
  - `http://localhost:3000/dashboard` (for development)

### 5. Rate Limiting (Security Best Practice)
Go to Supabase Dashboard → Authentication → Settings → Rate Limits

**Recommended settings:**
- **Email sending rate**: `3` per hour
- **SMS sending rate**: `3` per hour  
- **Phone confirmations**: `10` per hour
- **Email confirmations**: `10` per hour

### 6. JWT Settings (Production Security)
Go to Supabase Dashboard → Settings → API → JWT Settings

**Recommended:**
- **JWT expiry**: `3600` seconds (1 hour)
- **JWT auto-refresh**: Enabled

### 7. Database Security Settings
Go to Supabase Dashboard → Settings → Database → Network Restrictions

**For Production:**
- Consider enabling **IP restrictions** if you know your server IPs
- Use **SSL enforcement**: Always enabled

## After Making These Changes:

1. Run the `fix-security-issues.sql` script in your Supabase SQL Editor
2. Test your authentication flow
3. Re-run the Security Advisor to verify all issues are resolved
4. Deploy your application

## Verification Checklist:

- [ ] RLS enabled on all tables
- [ ] Auth OTP expiry reduced to 10 minutes
- [ ] Leaked password protection enabled
- [ ] Production URLs configured
- [ ] Rate limiting configured
- [ ] All security policies created and tested 
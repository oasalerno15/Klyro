# Complete Domain Setup Guide for https://kly-ro.xyz

## 🎯 **Overview**
This guide will help you configure your domain `https://kly-ro.xyz` across all services for proper authentication and functionality.

## 1. 🔧 **Vercel Environment Variables**

**Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Add this variable:**
- **Name:** `NEXT_PUBLIC_APP_URL`
- **Value:** `https://kly-ro.xyz`
- **Environment:** Production (and Preview if desired)

**Click "Save" and redeploy if needed.**

## 2. 🗄️ **Supabase Configuration**

### **A. URL Configuration**
**Go to:** Supabase Dashboard → Authentication → Settings → URL Configuration

**Set these values:**
- **Site URL:** `https://kly-ro.xyz`

**Redirect URLs (add all of these):**
```
https://kly-ro.xyz/auth/callback
https://kly-ro.xyz/dashboard
https://kly-ro.xyz/account
http://localhost:3000/auth/callback
http://localhost:3000/dashboard
```

### **B. Google OAuth Provider**
**Go to:** Supabase Dashboard → Authentication → Providers → Google

**Enable Google and add:**
- **Client ID:** (from Google Cloud Console)
- **Client Secret:** (from Google Cloud Console)

## 3. 🔐 **Google Cloud Console OAuth Setup**

### **A. Find Your OAuth Client**
1. Go to: https://console.cloud.google.com/
2. Select your project
3. Navigate to: **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID**

### **B. Update Authorized Redirect URIs**
**Add these URLs to your OAuth client:**
```
https://xitslocugrjkgcidqkor.supabase.co/auth/v1/callback
https://kly-ro.xyz/auth/callback
https://kly-ro.xyz/dashboard
http://localhost:3000/auth/callback
```

### **C. Update Authorized JavaScript Origins**
**Add these domains:**
```
https://kly-ro.xyz
https://xitslocugrjkgcidqkor.supabase.co
http://localhost:3000
```

## 4. 🧪 **Testing Your Setup**

### **A. Test Environment Variables**
Visit: `https://kly-ro.xyz/debug-auth`

**Should show:**
- `appUrl: "https://kly-ro.xyz"`
- `windowOrigin: "https://kly-ro.xyz"`
- `redirectUrl: "https://kly-ro.xyz/auth/callback"`

### **B. Test Authentication Flow**
1. Go to: `https://kly-ro.xyz`
2. Click "Sign in with Google"
3. Should redirect to Google OAuth
4. After authentication, should redirect to your dashboard

## 5. 🔍 **Troubleshooting**

### **Common Issues:**

**Issue:** Still seeing Supabase URL in OAuth
- **Fix:** Update Google Cloud Console redirect URIs

**Issue:** Environment variables not working
- **Fix:** Redeploy from Vercel Dashboard

**Issue:** CSP errors in console
- **Fix:** Already fixed in latest deployment

**Issue:** "Redirect URI mismatch" error
- **Fix:** Ensure all URLs in Google Cloud Console match exactly

## 6. ✅ **Verification Checklist**

- [ ] Vercel environment variable `NEXT_PUBLIC_APP_URL` set
- [ ] Supabase Site URL set to `https://kly-ro.xyz`
- [ ] Supabase redirect URLs include your domain
- [ ] Google Cloud Console redirect URIs updated
- [ ] Google Cloud Console JavaScript origins updated
- [ ] Debug page shows correct environment variables
- [ ] Authentication flow works end-to-end

## 7. 🚀 **Final Steps**

1. **Clear browser cache** (important for OAuth)
2. **Test in incognito mode** to avoid cached auth states
3. **Check browser console** for any remaining errors
4. **Test on mobile** to ensure responsive auth flow

## 8. 📞 **Support**

If you're still having issues after following this guide:
1. Check the debug page: `https://kly-ro.xyz/debug-auth`
2. Look for console errors in browser dev tools
3. Verify all URLs match exactly (no trailing slashes, correct protocols)

---

**Your domain `https://kly-ro.xyz` should now work perfectly with authentication!** 🎉 
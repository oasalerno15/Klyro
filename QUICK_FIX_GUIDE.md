# 🚀 Quick Fix Guide for Receipt Upload Errors

## Issues You're Experiencing:
1. ❌ "Could not find the 'category' column of 'transactions' in the schema cache"
2. ❌ "API Error: 500" during receipt upload

## 🔧 Solution Steps:

### Step 1: Fix Database Schema
The database tables either don't exist or have the wrong structure.

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/xitslocugrjkgcidqkor)
2. Click **"SQL Editor"** in the left sidebar  
3. Copy the entire contents of `RECEIPT_ONLY_TABLES.sql` from your project
4. Paste it into the SQL Editor
5. Click **"Run"** button
6. You should see success messages

### Step 2: Verify Environment Setup
Run this command to check your environment:
```bash
node check-env.js
```

### Step 3: Check Your .env.local File
Make sure you have a `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xitslocugrjkgcidqkor.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdHNsb2N1Z3Jqa2djaWRxa29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Mjk1MjgsImV4cCI6MjA2MzQwNTUyOH0.i0GZHIhnQS1s24TFdHEL-bqNojEk91JRUOoL4fH8P6U

# Optional: For real AI analysis (demo mode works without this)
OPENAI_API_KEY=your_openai_key_here
```

### Step 4: Restart Your Development Server
```bash
npm run dev
```

## ✅ What Should Work After the Fix:

1. **Receipt Upload**: Should work in demo mode (generates realistic fake data)
2. **Database Storage**: Transactions should save to your Supabase database  
3. **No Console Errors**: The annoying error messages should be gone

## 🎯 Expected Behavior:

- Upload a receipt → Gets "analyzed" with demo data → Appears in your transaction list
- No more schema errors in console
- API returns 200 status instead of 500
- Clean, error-free experience

## 🆘 If You Still Have Issues:

1. Check the browser console for new error messages
2. Verify the database tables were created in Supabase
3. Run `node check-env.js` to verify environment setup
4. Try refreshing the page after database setup

The app will work perfectly with demo data - you don't need real OpenAI for testing! 
# Database Setup for Vireo (Receipt-Only)

Your Google sign-in is working! 🎉 Now we need to set up the database tables in Supabase.

## 🗄️ What you're setting up

Your app stores **receipt-based transactions only** (no Plaid/bank connections):
- **`transactions`** - Individual spending items from receipts analyzed by AI
- **`spending_logs`** - Summary spending records 
- **`mood_logs`** - Daily mood tracking data

## 📋 Steps to Set Up Database

### 1. Open Supabase Dashboard
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click on your project: **xitslocugrjkgcidqkor**
3. Click on **"SQL Editor"** in the left sidebar

### 2. Run the Database Script
1. In the SQL Editor, click **"+ New query"**
2. Copy and paste the entire contents of `RECEIPT_ONLY_TABLES.sql` (in your project root)
3. Click **"Run"** button (or press Ctrl+Enter)

### 3. Verify Tables Created
1. Go to **"Table Editor"** in the left sidebar
2. You should see 3 new tables:
   - `transactions`
   - `spending_logs` 
   - `mood_logs`

### 4. Test Your App
1. Restart your development server: `npm run dev`
2. Sign in with Google
3. Upload a receipt to test the flow

## ✅ What happens after setup

- **Receipt Upload**: AI analyzes receipts → saves to `transactions` table
- **Spending Tracking**: Records saved to `spending_logs` table  
- **Mood Tracking**: Daily mood entries saved to `mood_logs` table
- **Row Level Security**: Only you can see your own data

## 🔒 Security Features

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Proper foreign key relationships with `auth.users`
- Indexes for performance optimization

## 🚫 What's NOT included

- ❌ No Plaid bank connections
- ❌ No automatic transaction syncing
- ❌ No bank account linking
- ✅ **Pure receipt-based spending tracking**

---

**Having issues?** Check the browser console for specific error messages and let me know! 
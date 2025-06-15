# Supabase Migration Setup Guide

## Current Status ✅
- ✅ Supabase client setup complete
- ✅ Auth context migrated from Firebase to Supabase  
- ✅ Dashboard migrated to use Supabase
- ✅ LoggingCards component migrated to Supabase
- ✅ Middleware configured for auth protection
- ✅ Database migrations created
- ✅ Receipt upload functionality implemented
- ✅ AI receipt analysis with OpenAI integration

## New Features Added 🎉

### Receipt Upload & AI Analysis
- **Upload receipts** directly from the dashboard chart
- **AI-powered analysis** using OpenAI GPT-4 Vision
- **Automatic categorization** of expenses
- **Real-time data saving** to Supabase
- **Chart integration** - spending data appears immediately in graphs

### How to Use:
1. Click "Upload Receipt" button in the dashboard chart
2. Drag & drop or select receipt photos
3. AI analyzes and extracts: merchant, amount, date, category, items
4. Data automatically saves to both `transactions` and `spending_logs` tables
5. Chart updates in real-time with new spending data

## Next Steps Required

### 1. Create Database Tables
**IMPORTANT**: You need to create the database tables first!

1. Go to https://supabase.com/dashboard/project/xitslocugrjkgcidqkor
2. Navigate to SQL Editor
3. Copy and paste the SQL from `create_tables.sql` file
4. Run the SQL to create all necessary tables with RLS policies

### 2. Configure OpenAI API Key (Optional)
The receipt analysis feature uses OpenAI's GPT-4 Vision API. If you don't have an API key, the app will work in **demo mode** with realistic sample data.

**To enable real AI analysis:**
```bash
# Add to your .env.local file
OPENAI_API_KEY=your_openai_api_key_here
```

**Demo Mode (No API Key Required):**
- Receipt uploads will generate realistic demo transactions
- Perfect for testing the UI and database functionality
- Shows merchants like "Starbucks", "Whole Foods", etc.
- Amounts between $10-60 with realistic categories

### 3. Test Receipt Upload
1. Start development server: `npm run dev`
2. Login to the dashboard
3. Click "Upload Receipt" button in the chart
4. Upload a receipt image
5. Verify data appears in Supabase tables and dashboard

### 4. Configure Google OAuth (Optional)

#### In Supabase Dashboard:
1. Go to Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID: (from Google Cloud Console)
   - Client Secret: (from Google Cloud Console)
4. Site URL: `https://kly-ro.xyz` (for production) or `http://localhost:3000` (for development)
5. Redirect URLs: `https://kly-ro.xyz/auth/callback` (for production) or `https://kly-ro.xyz/dashboard` (for production) or `http://localhost:3000` (for development)

#### In Google Cloud Console:
1. Go to https://console.cloud.google.com/
2. Enable Google+ API (or Google Identity API)
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs:
   - `https://kly-ro.xyz/auth/callback` (for production)
   - `https://kly-ro.xyz/dashboard` (for production)
   - `http://localhost:3000` (for development)
5. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://your-production-domain.com` (when you deploy)

## Database Schema

### Tables Created:
- **`mood_logs`** - User mood entries with date constraints
- **`spending_logs`** - User spending entries (manual + receipt)
- **`transactions`** - Detailed transaction data (Plaid + receipt)

### Features:
- Row Level Security (RLS) enabled
- User isolation (users can only see their own data)
- Automatic timestamps
- Proper indexes for performance
- Receipt metadata storage (confidence, items, etc.)

## Receipt Analysis Features

### AI Capabilities:
- **Merchant Detection** - Identifies store/restaurant names
- **Amount Extraction** - Finds total purchase amount
- **Date Recognition** - Extracts transaction date
- **Smart Categorization** - Auto-assigns spending categories
- **Item Breakdown** - Lists individual purchased items
- **Confidence Scoring** - Rates analysis accuracy (0-1)

### Supported Categories:
- Groceries, Restaurant, Gas, Shopping, Entertainment
- Healthcare, Transportation, Utilities, and more
- Custom categories based on receipt content

### Quality Indicators:
- Low confidence receipts show warning messages
- Encourages users to upload clearer photos
- Fallback handling for unclear images

## Migration Benefits
- ✅ Better performance with Supabase
- ✅ Real-time subscriptions available
- ✅ Built-in auth with multiple providers
- ✅ Automatic API generation
- ✅ Better developer experience
- ✅ More generous free tier than Firebase
- ✅ AI-powered receipt analysis
- ✅ Seamless spending tracking

## Troubleshooting

### Receipt Upload Issues:
- **"Failed to analyze receipt"**: Check OpenAI API key configuration
- **"No response from OpenAI"**: Verify API key has sufficient credits
- **Low confidence warnings**: Try uploading clearer, well-lit photos
- **Data not saving**: Check Supabase table creation and RLS policies

### Database Issues:
- **"Table doesn't exist"**: Run the SQL from `create_tables.sql`
- **"Permission denied"**: Check RLS policies are created correctly
- **"Connection failed"**: Verify Supabase project is unpaused

### Auth Issues:
- **"not secure" warnings**: Make sure Google OAuth is properly configured
- **Redirect errors**: Check that redirect URLs match exactly
- **Login failures**: Ensure you're using HTTPS in production

### Performance Issues:
- **Slow receipt analysis**: Large images take longer to process
- **Chart not updating**: Check browser console for errors
- **Data sync issues**: Verify Supabase connection and user authentication

## SQL to create mood_logs, spending_logs, and transactions tables

```sql
-- Create mood_logs table
CREATE TABLE IF NOT EXISTS mood_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 10),
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create spending_logs table
CREATE TABLE IF NOT EXISTS spending_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(19,4) NOT NULL,
    date DATE NOT NULL,
    category TEXT,
    merchant TEXT,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plaid_transaction_id TEXT UNIQUE,
    name TEXT NOT NULL,
    amount DECIMAL(19,4) NOT NULL,
    date DATE NOT NULL,
    category TEXT[] DEFAULT '{}',
    account_id TEXT,
    pending BOOLEAN DEFAULT false,
    merchant_name TEXT,
    payment_channel TEXT,
    source TEXT DEFAULT 'plaid',
    confidence DECIMAL(3,2),
    items JSONB,
    file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own mood logs" ON mood_logs
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own spending logs" ON spending_logs
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own transactions" ON transactions
    USING (auth.uid() = user_id);
``` 
-- Complete Database Setup for Klyro App
-- Run this script to create all tables and security policies from scratch

-- ========================================
-- STEP 1: CREATE ALL TABLES
-- ========================================

-- 1. Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create mood_logs table
CREATE TABLE IF NOT EXISTS public.mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_level INTEGER CHECK (mood_level >= 1 AND mood_level <= 10),
  mood_description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 3. Create spending_logs table
CREATE TABLE IF NOT EXISTS public.spending_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT,
  merchant TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create transactions table (main table for financial data)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT[] DEFAULT ARRAY['General'],
  source TEXT DEFAULT 'receipt',
  confidence DECIMAL(3,2) DEFAULT 0.80,
  items JSONB,
  file_name TEXT,
  need_vs_want TEXT CHECK (need_vs_want IN ('Need', 'Want')),
  mood_at_purchase TEXT,
  ai_insight TEXT,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create accounts table (for financial accounts)
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_type TEXT,
  balance DECIMAL(10,2) DEFAULT 0.00,
  institution_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create categories table (for expense categories)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 7. Create plaid_items table (for Plaid integration)
CREATE TABLE IF NOT EXISTS public.plaid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL UNIQUE,
  access_token TEXT,
  institution_name TEXT,
  institution_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create calendar_data table (for calendar features)
CREATE TABLE IF NOT EXISTS public.calendar_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_form JSONB NOT NULL,
  task_statuses JSONB DEFAULT '{}',
  step_statuses JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ========================================
-- STEP 2: CREATE FUNCTIONS AND TRIGGERS
-- ========================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_col()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_col();

DROP TRIGGER IF EXISTS update_mood_logs_updated_at ON public.mood_logs;
CREATE TRIGGER update_mood_logs_updated_at
  BEFORE UPDATE ON public.mood_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_col();

DROP TRIGGER IF EXISTS update_spending_logs_updated_at ON public.spending_logs;
CREATE TRIGGER update_spending_logs_updated_at
  BEFORE UPDATE ON public.spending_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_col();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_col();

DROP TRIGGER IF EXISTS update_accounts_updated_at ON public.accounts;
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_col();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_col();

DROP TRIGGER IF EXISTS update_plaid_items_updated_at ON public.plaid_items;
CREATE TRIGGER update_plaid_items_updated_at
  BEFORE UPDATE ON public.plaid_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_col();

DROP TRIGGER IF EXISTS update_calendar_data_updated_at ON public.calendar_data;
CREATE TRIGGER update_calendar_data_updated_at
  BEFORE UPDATE ON public.calendar_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_col();

-- ========================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_mood_logs_user_id ON public.mood_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_logs_date ON public.mood_logs(date);
CREATE INDEX IF NOT EXISTS idx_spending_logs_user_id ON public.spending_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_spending_logs_date ON public.spending_logs(date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_items_user_id ON public.plaid_items(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_data_user_id ON public.calendar_data(user_id);

-- ========================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spending_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_data ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 5: CREATE RLS POLICIES
-- ========================================

-- Users table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Mood logs policies
DROP POLICY IF EXISTS "Users can view their own mood logs" ON public.mood_logs;
DROP POLICY IF EXISTS "Users can insert their own mood logs" ON public.mood_logs;
DROP POLICY IF EXISTS "Users can update their own mood logs" ON public.mood_logs;
DROP POLICY IF EXISTS "Users can delete their own mood logs" ON public.mood_logs;

CREATE POLICY "Users can view their own mood logs" ON public.mood_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mood logs" ON public.mood_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood logs" ON public.mood_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood logs" ON public.mood_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Spending logs policies
DROP POLICY IF EXISTS "Users can view their own spending logs" ON public.spending_logs;
DROP POLICY IF EXISTS "Users can insert their own spending logs" ON public.spending_logs;
DROP POLICY IF EXISTS "Users can update their own spending logs" ON public.spending_logs;
DROP POLICY IF EXISTS "Users can delete their own spending logs" ON public.spending_logs;

CREATE POLICY "Users can view their own spending logs" ON public.spending_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spending logs" ON public.spending_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spending logs" ON public.spending_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spending logs" ON public.spending_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Accounts policies
DROP POLICY IF EXISTS "Users can view their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;

CREATE POLICY "Users can view their own accounts" ON public.accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" ON public.accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" ON public.accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Categories policies
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;

CREATE POLICY "Users can view their own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- Plaid items policies
DROP POLICY IF EXISTS "Users can view their own plaid items" ON public.plaid_items;
DROP POLICY IF EXISTS "Users can insert their own plaid items" ON public.plaid_items;
DROP POLICY IF EXISTS "Users can update their own plaid items" ON public.plaid_items;
DROP POLICY IF EXISTS "Users can delete their own plaid items" ON public.plaid_items;

CREATE POLICY "Users can view their own plaid items" ON public.plaid_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plaid items" ON public.plaid_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plaid items" ON public.plaid_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plaid items" ON public.plaid_items
  FOR DELETE USING (auth.uid() = user_id);

-- Calendar data policies
DROP POLICY IF EXISTS "Users can view their own calendar data" ON public.calendar_data;
DROP POLICY IF EXISTS "Users can insert their own calendar data" ON public.calendar_data;
DROP POLICY IF EXISTS "Users can update their own calendar data" ON public.calendar_data;
DROP POLICY IF EXISTS "Users can delete their own calendar data" ON public.calendar_data;

CREATE POLICY "Users can view their own calendar data" ON public.calendar_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar data" ON public.calendar_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar data" ON public.calendar_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar data" ON public.calendar_data
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- STEP 6: SET PERMISSIONS
-- ========================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spending_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plaid_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_data TO authenticated;

-- Revoke all permissions from public (security)
REVOKE ALL ON public.users FROM public;
REVOKE ALL ON public.mood_logs FROM public;
REVOKE ALL ON public.spending_logs FROM public;
REVOKE ALL ON public.transactions FROM public;
REVOKE ALL ON public.accounts FROM public;
REVOKE ALL ON public.categories FROM public;
REVOKE ALL ON public.plaid_items FROM public;
REVOKE ALL ON public.calendar_data FROM public;

-- ========================================
-- STEP 7: INSERT DEFAULT DATA
-- ========================================

-- We'll leave default data insertion for later
-- Categories will be created automatically when users start using the app

-- ========================================
-- STEP 8: VERIFICATION
-- ========================================

-- Show all created tables
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Show RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show all policies created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname; 
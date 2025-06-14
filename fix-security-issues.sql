-- Fix Security Issues in Supabase (Updated Version)
-- Run this script AFTER running fix-missing-columns.sql

-- 1. Enable RLS on all tables (only if they exist)
DO $$
BEGIN
  -- Enable RLS on tables that exist
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts') THEN
    ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'plaid_items') THEN
    ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mood_logs') THEN
    ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'spending_logs') THEN
    ALTER TABLE public.spending_logs ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_data') THEN
    ALTER TABLE public.calendar_data ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 2. Create RLS policies for users table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
    
    -- Create new policies
    CREATE POLICY "Users can view their own profile" ON public.users
      FOR SELECT USING (auth.uid() = id);

    CREATE POLICY "Users can update their own profile" ON public.users
      FOR UPDATE USING (auth.uid() = id);

    CREATE POLICY "Users can insert their own profile" ON public.users
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 3. Create RLS policies for accounts table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts') THEN
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
  END IF;
END $$;

-- 4. Create RLS policies for categories table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
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
  END IF;
END $$;

-- 5. Create RLS policies for plaid_items table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'plaid_items') THEN
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
  END IF;
END $$;

-- 6. Create RLS policies for mood_logs table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mood_logs') THEN
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
  END IF;
END $$;

-- 7. Create RLS policies for spending_logs table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'spending_logs') THEN
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
  END IF;
END $$;

-- 8. Create RLS policies for transactions table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
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
  END IF;
END $$;

-- 9. Create RLS policies for calendar_data table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_data') THEN
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
  END IF;
END $$;

-- 10. Create indexes for better performance with RLS (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts') THEN
    CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'plaid_items') THEN
    CREATE INDEX IF NOT EXISTS idx_plaid_items_user_id ON public.plaid_items(user_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mood_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_mood_logs_user_id ON public.mood_logs(user_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'spending_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_spending_logs_user_id ON public.spending_logs(user_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_data') THEN
    CREATE INDEX IF NOT EXISTS idx_calendar_data_user_id ON public.calendar_data(user_id);
  END IF;
END $$;

-- 11. Grant appropriate permissions (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'plaid_items') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.plaid_items TO authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mood_logs') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_logs TO authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'spending_logs') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.spending_logs TO authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_data') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_data TO authenticated;
  END IF;
END $$;

-- 12. Revoke public access (security best practice)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    REVOKE ALL ON public.users FROM public;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts') THEN
    REVOKE ALL ON public.accounts FROM public;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    REVOKE ALL ON public.categories FROM public;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'plaid_items') THEN
    REVOKE ALL ON public.plaid_items FROM public;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mood_logs') THEN
    REVOKE ALL ON public.mood_logs FROM public;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'spending_logs') THEN
    REVOKE ALL ON public.spending_logs FROM public;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    REVOKE ALL ON public.transactions FROM public;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_data') THEN
    REVOKE ALL ON public.calendar_data FROM public;
  END IF;
END $$;

-- 13. Final verification - show all tables with RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename; 
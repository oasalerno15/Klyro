const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const createTables = async () => {
  console.log('🚀 Setting up Vireo database tables...\n');

  const sql = `
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

-- Create RLS policies for mood_logs
DROP POLICY IF EXISTS "Users can manage their own mood logs" ON mood_logs;
CREATE POLICY "Users can manage their own mood logs" ON mood_logs
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for spending_logs
DROP POLICY IF EXISTS "Users can manage their own spending logs" ON spending_logs;
CREATE POLICY "Users can manage their own spending logs" ON spending_logs
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for transactions
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;
CREATE POLICY "Users can manage their own transactions" ON transactions
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON mood_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_spending_logs_user_date ON spending_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_plaid_id ON transactions(plaid_transaction_id);
  `;

  try {
    console.log('📊 Creating database tables...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Try alternative method using the REST API
      console.log('🔄 Trying alternative method...');
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    console.log('✅ Database tables created successfully!');
    console.log('\n📋 Created tables:');
    console.log('   • mood_logs (for tracking daily moods)');
    console.log('   • spending_logs (for spending data)');
    console.log('   • transactions (for detailed transaction records)');
    console.log('\n🔒 Row Level Security enabled for all tables');
    console.log('🚀 Your Vireo app is now ready to use!');
    console.log('\n💡 Refresh your dashboard to start using receipt upload and data tracking.');

  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    console.log('\n🔧 Manual setup required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL from create_tables.sql');
    console.log('4. Run the SQL query');
  }
};

createTables(); 
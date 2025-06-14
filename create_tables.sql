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
CREATE POLICY "Users can manage their own mood logs" ON mood_logs
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for spending_logs
CREATE POLICY "Users can manage their own spending logs" ON spending_logs
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can manage their own transactions" ON transactions
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON mood_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_spending_logs_user_date ON spending_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_plaid_id ON transactions(plaid_transaction_id); 
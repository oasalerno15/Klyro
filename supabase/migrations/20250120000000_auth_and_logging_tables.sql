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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON mood_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_spending_logs_user_date ON spending_logs(user_id, date);

-- Enable Row Level Security (RLS)
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for mood_logs
CREATE POLICY "Users can view their own mood logs" ON mood_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mood logs" ON mood_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood logs" ON mood_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood logs" ON mood_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for spending_logs
CREATE POLICY "Users can view their own spending logs" ON spending_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spending logs" ON spending_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spending logs" ON spending_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spending logs" ON spending_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_mood_logs_updated_at
    BEFORE UPDATE ON mood_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spending_logs_updated_at
    BEFORE UPDATE ON spending_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 
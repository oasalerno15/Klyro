-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    account_id TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    category TEXT[] NOT NULL,
    date DATE NOT NULL,
    merchant_name TEXT,
    payment_channel TEXT NOT NULL,
    pending BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on user_id and date for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);

-- Insert some sample data
INSERT INTO transactions (user_id, account_id, amount, category, date, merchant_name, payment_channel, pending)
VALUES
    ('00000000-0000-0000-0000-000000000000', 'acc_123', -45.99, ARRAY['Food and Drink', 'Restaurants'], '2024-03-24', 'Starbucks', 'online', false),
    ('00000000-0000-0000-0000-000000000000', 'acc_123', -29.99, ARRAY['Shops', 'Clothing'], '2024-03-23', 'H&M', 'in store', false),
    ('00000000-0000-0000-0000-000000000000', 'acc_123', 1200.00, ARRAY['Transfer', 'Payroll'], '2024-03-22', 'Employer Inc', 'other', false),
    ('00000000-0000-0000-0000-000000000000', 'acc_123', -89.99, ARRAY['Food and Drink', 'Groceries'], '2024-03-21', 'Whole Foods', 'in store', false),
    ('00000000-0000-0000-0000-000000000000', 'acc_123', -15.00, ARRAY['Travel', 'Ride Share'], '2024-03-20', 'Uber', 'online', false); 
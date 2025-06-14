-- Create enum for account types
CREATE TYPE account_type AS ENUM ('depository', 'credit', 'loan', 'investment', 'other');

-- Create enum for account subtypes
CREATE TYPE account_subtype AS ENUM (
    'checking', 'savings', 'cd', 'money_market',
    'credit_card', 'mortgage', 'auto', 'student',
    'personal', 'business', 'other'
);

-- Create enum for transaction types
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create plaid_items table
CREATE TABLE plaid_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plaid_item_id TEXT NOT NULL,
    plaid_access_token TEXT NOT NULL,
    institution_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plaid_item_id)
);

-- Create accounts table
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plaid_item_id UUID REFERENCES plaid_items(id) ON DELETE CASCADE,
    plaid_account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    official_name TEXT,
    type account_type NOT NULL,
    subtype account_subtype,
    mask TEXT,
    current_balance DECIMAL(19,4),
    available_balance DECIMAL(19,4),
    iso_currency_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plaid_account_id)
);

-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_category_id UUID REFERENCES categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    plaid_transaction_id TEXT NOT NULL,
    category_id UUID REFERENCES categories(id),
    amount DECIMAL(19,4) NOT NULL,
    type transaction_type NOT NULL,
    date DATE NOT NULL,
    name TEXT NOT NULL,
    merchant_name TEXT,
    payment_channel TEXT,
    pending BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plaid_transaction_id)
);

-- Create indexes
CREATE INDEX idx_plaid_items_user_id ON plaid_items(user_id);
CREATE INDEX idx_accounts_plaid_item_id ON accounts(plaid_item_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);

-- Insert seed data for categories
INSERT INTO categories (name, parent_category_id) VALUES
    ('Food and Drink', NULL),
    ('Restaurants', (SELECT id FROM categories WHERE name = 'Food and Drink')),
    ('Groceries', (SELECT id FROM categories WHERE name = 'Food and Drink')),
    ('Transportation', NULL),
    ('Gas', (SELECT id FROM categories WHERE name = 'Transportation')),
    ('Public Transit', (SELECT id FROM categories WHERE name = 'Transportation')),
    ('Shopping', NULL),
    ('Clothing', (SELECT id FROM categories WHERE name = 'Shopping')),
    ('Electronics', (SELECT id FROM categories WHERE name = 'Shopping')),
    ('Entertainment', NULL),
    ('Movies', (SELECT id FROM categories WHERE name = 'Entertainment')),
    ('Music', (SELECT id FROM categories WHERE name = 'Entertainment')),
    ('Bills and Utilities', NULL),
    ('Phone', (SELECT id FROM categories WHERE name = 'Bills and Utilities')),
    ('Internet', (SELECT id FROM categories WHERE name = 'Bills and Utilities')),
    ('Rent', (SELECT id FROM categories WHERE name = 'Bills and Utilities'));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plaid_items_updated_at
    BEFORE UPDATE ON plaid_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


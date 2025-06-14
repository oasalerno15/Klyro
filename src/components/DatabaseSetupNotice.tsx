'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaDatabase, FaExternalLinkAlt, FaCopy } from 'react-icons/fa';
import { useState } from 'react';

interface DatabaseSetupNoticeProps {
  darkMode?: boolean;
}

export default function DatabaseSetupNotice({ darkMode = false }: DatabaseSetupNoticeProps) {
  const [copied, setCopied] = useState(false);

  const sqlContent = `-- Clean receipt-only database schema for Vireo
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security (RLS) for all tables
ALTER DATABASE postgres SET timezone TO 'UTC';

-- Create mood_logs table for mood tracking
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

-- Create spending_logs table for spending tracking
CREATE TABLE IF NOT EXISTS spending_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(19,4) NOT NULL,
    date DATE NOT NULL,
    category TEXT DEFAULT 'General',
    merchant TEXT,
    source TEXT DEFAULT 'receipt',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table for receipt-based transactions only
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(19,4) NOT NULL,
    date DATE NOT NULL,
    category TEXT[] DEFAULT '{General}',
    source TEXT DEFAULT 'receipt',
    confidence DECIMAL(3,2) DEFAULT 0.80,
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

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON mood_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_spending_logs_user_date ON spending_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(source);

-- Grant usage on UUID extension (needed for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={`p-6 ${darkMode ? 'bg-blue-900 border-blue-800' : 'bg-blue-50 border-blue-200'} border rounded-lg mb-8`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'} mt-0.5`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
            Database Setup Required
          </h3>
          <div className={`mt-2 text-sm ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
            <p className="mb-2">Your Supabase database tables need to be created. Follow these steps:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-medium">Supabase Dashboard</a></li>
              <li>Navigate to <strong>SQL Editor</strong> in the left sidebar</li>
              <li>Copy the contents of <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">RECEIPT_ONLY_TABLES.sql</code> from your project</li>
              <li>Paste it into the SQL Editor and click <strong>"Run"</strong></li>
              <li>Refresh this page once complete</li>
            </ol>
            <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-800 rounded">
              <p className="text-xs font-medium">File Location:</p>
              <code className="text-xs">/Users/osalerno/vireo/RECEIPT_ONLY_TABLES.sql</code>
            </div>
          </div>
          <div className="mt-3">
            <button
              onClick={() => window.location.reload()}
              className={`text-sm font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} underline`}
            >
              Refresh page after setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
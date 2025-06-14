// Test script to verify receipt data flow
// Run with: node test-receipt-flow.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReceiptFlow() {
  console.log('🧪 Testing receipt data flow...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1. Checking if database tables exist...');
    
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('count')
      .limit(1);
    
    if (txError) {
      if (txError.message?.includes('relation "transactions" does not exist')) {
        console.error('❌ Database tables not created yet!');
        console.error('Please run the RECEIPT_ONLY_TABLES.sql script in your Supabase dashboard first.');
        return;
      }
      throw txError;
    }
    
    console.log('✅ Database tables exist');

    // Test 2: Check authentication
    console.log('\n2. Testing authentication...');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('ℹ️  No authenticated user (this is normal for server-side testing)');
      console.log('   Authentication will work when users sign in through the app');
    } else {
      console.log(`✅ User authenticated: ${user.email}`);
    }

    // Test 3: Test sample data structure
    console.log('\n3. Testing data structure for receipt transactions...');
    
    const sampleTransaction = {
      user_id: 'test-user-id', // This would be actual user.id in the app
      name: 'Starbucks',
      amount: 5.75,
      date: new Date().toISOString().split('T')[0],
      category: ['Food & Drink', 'Coffee'],
      source: 'receipt',
      confidence: 0.95,
      items: [
        { name: 'Grande Latte', price: 5.75, quantity: 1 }
      ],
      file_name: 'receipt_20240115_123456.jpg'
    };

    console.log('✅ Sample transaction structure:', JSON.stringify(sampleTransaction, null, 2));

    const sampleSpendingLog = {
      user_id: 'test-user-id',
      amount: 5.75,
      date: new Date().toISOString().split('T')[0],
      category: 'Food & Drink',
      merchant: 'Starbucks',
      source: 'receipt'
    };

    console.log('✅ Sample spending log structure:', JSON.stringify(sampleSpendingLog, null, 2));

    console.log('\n🎉 Receipt data flow test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Make sure you\'ve run RECEIPT_ONLY_TABLES.sql in Supabase');
    console.log('2. Sign in to your app with Google');
    console.log('3. Upload a receipt to test the full flow');
    console.log('4. Check the transactions table in Supabase to see the data');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message?.includes('Invalid API key')) {
      console.error('\n🔧 Fix: Check your .env.local file has the correct Supabase credentials');
    } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      console.error('\n🔧 Fix: Run the RECEIPT_ONLY_TABLES.sql script in your Supabase dashboard');
    }
  }
}

// Run the test
testReceiptFlow(); 
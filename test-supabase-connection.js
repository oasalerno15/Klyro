// Quick test to verify Supabase connection and Google OAuth setup
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Configuration...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.log('Please create .env.local with:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://xitslocugrjkgcidqkor.supabase.co');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log(`📍 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Anon Key: ${supabaseKey.substring(0, 20)}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('⚠️  Session check returned error:', error.message);
    } else {
      console.log('✅ Supabase connection successful');
    }

    // Test Google OAuth
    console.log('\n🔍 Testing Google OAuth...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://kly-ro.xyz/dashboard'
      }
    });

    if (authError) {
      console.log('❌ Google OAuth Error:', authError.message);
      
      if (authError.message.includes('provider is not enabled')) {
        console.log('\n🔧 Fix: Enable Google provider in Supabase Dashboard:');
        console.log('   1. Go to Authentication → Providers');
        console.log('   2. Enable Google');
        console.log('   3. Add Client ID and Client Secret from Google Cloud Console');
      }
    } else {
      console.log('✅ Google OAuth configuration appears to be working');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testConnection(); 
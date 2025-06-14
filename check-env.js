// Environment check script for Vireo
// Run with: node check-env.js

import dotenv from 'dotenv';
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🔍 Checking Vireo environment setup...\n');

// Check Supabase configuration
console.log('📊 Supabase Configuration:');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (supabaseUrl) {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL is set');
  console.log(`   URL: ${supabaseUrl}`);
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL is missing');
}

if (supabaseKey) {
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set');
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
}

// Check OpenAI configuration
console.log('\n🤖 OpenAI Configuration:');
const openaiKey = process.env.OPENAI_API_KEY;

if (openaiKey) {
  console.log('✅ OPENAI_API_KEY is set');
  console.log(`   Key: ${openaiKey.substring(0, 20)}...`);
  console.log('   Receipt analysis will use real AI');
} else {
  console.log('⚠️  OPENAI_API_KEY is not set');
  console.log('   Receipt analysis will use demo mode');
}

// Environment file check
console.log('\n📁 Environment File:');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
console.log('Looking for .env.local at:', envPath);

if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file found');
  
  // Read the file content
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('\n📝 File content:');
  console.log(envContent);
  
  // Try to parse it
  const parsedEnv = dotenv.parse(envContent);
  console.log('\n🔑 Parsed environment variables:');
  Object.keys(parsedEnv).forEach(key => {
    if (key.includes('KEY') || key.includes('SECRET')) {
      console.log(`${key}: [Present] Length: ${parsedEnv[key].length}`);
    } else {
      console.log(`${key}: ${parsedEnv[key]}`);
    }
  });
} else {
  console.log('❌ .env.local file not found');
}

console.log('\n🎯 Summary:');
const issues = [];

if (!supabaseUrl || !supabaseKey) {
  issues.push('Missing Supabase credentials');
}

if (!openaiKey) {
  issues.push('Missing OpenAI API key (will use demo mode)');
}

if (issues.length === 0) {
  console.log('🎉 All environment variables are properly configured!');
} else {
  console.log('🔧 Issues found:');
  issues.forEach(issue => console.log(`   - ${issue}`));
  
  console.log('\n📋 Next steps:');
  console.log('1. Create or update .env.local file');
  console.log('2. Add your Supabase URL and anon key');
  console.log('3. Optionally add OpenAI API key for real AI analysis');
  console.log('4. Restart your development server');
}

console.log('\n✨ Happy coding with Vireo!'); 
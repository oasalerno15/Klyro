import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Checking environment setup...\n');

// Check if .env.local exists
const envPath = join(__dirname, '.env.local');
console.log('Looking for .env.local at:', envPath);

if (existsSync(envPath)) {
  console.log('✅ .env.local file found');
  
  // Read the file content
  const envContent = readFileSync(envPath, 'utf8');
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
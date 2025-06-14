// Quick script to check your OpenAI account status
// Run this to see your current limits and usage

console.log('🔍 OpenAI Account Checker');
console.log('========================');

console.log('\n📋 Steps to check your OpenAI account:');
console.log('1. Go to: https://platform.openai.com/account/usage');
console.log('2. Check your current usage and limits');
console.log('3. Go to: https://platform.openai.com/account/billing/overview');
console.log('4. Verify you have a positive balance');
console.log('5. Check if you have auto-recharge enabled');

console.log('\n⚠️ Common Issues:');
console.log('• Payment processing can take 2-4 hours');
console.log('• You need at least $5 minimum to start using API');
console.log('• Rate limits are different from quota limits');
console.log('• Some countries have restrictions');

console.log('\n🔧 Quick Fixes to Try:');
console.log('1. Wait 2-4 hours after adding funds');
console.log('2. Create a new API key');
console.log('3. Try a different model (gpt-3.5-turbo vs gpt-4)');
console.log('4. Check if you\'re in a supported country');

console.log('\n💡 If none of this works:');
console.log('• Contact OpenAI support directly');
console.log('• Check OpenAI status page for outages');
console.log('• Try the playground first before API calls');

// Check current environment
const apiKey = process.env.OPENAI_API_KEY;
if (apiKey) {
  console.log(`\n✅ API Key is set (${apiKey.substring(0, 7)}...)`);
  console.log('🔄 Testing API connection...');
  console.log('Visit: http://localhost:3000/api/debug-openai');
} else {
  console.log('\n❌ No OPENAI_API_KEY found in environment');
} 
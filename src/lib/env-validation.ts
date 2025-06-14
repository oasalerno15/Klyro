// Environment variable validation utility
export function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  
  const optional = [
    'OPENAI_API_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  const warnings = optional.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️ Missing optional environment variables (fallbacks will be used):', warnings);
  }
  
  console.log('✅ Environment variables validated successfully');
  
  return {
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasSupabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  };
} 
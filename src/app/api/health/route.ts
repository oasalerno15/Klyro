import { NextRequest, NextResponse } from 'next/server';
import { validateEnvironment } from '@/lib/env-validation';

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    const envStatus = validateEnvironment();
    
    // Check API availability
    const services = {
      environment: envStatus,
      openai: envStatus.hasOpenAI ? 'available' : 'not configured (using fallbacks)',
      supabase: envStatus.hasSupabase ? 'available' : 'not configured',
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json({
      status: 'healthy',
      services,
      message: 'All systems operational'
    });
    
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    };

    return NextResponse.json(healthData);
  } catch (error) {
    const errorDetails = error as Error;
    
    return NextResponse.json({
      status: 'unhealthy',
      error: errorDetails?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 
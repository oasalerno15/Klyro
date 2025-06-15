import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    // Check if environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Supabase environment variables not configured');
      return NextResponse.json({ 
        error: 'Server configuration error - Supabase not configured',
        fallback: true
      }, { status: 500 });
    }

    // Create Supabase client inside the function to avoid build-time issues
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('📥 Load API called');
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');

    console.log('📥 Looking for user_id:', user_id);

    if (!user_id) {
      console.log('❌ No user_id provided');
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get auth header from request
    const authHeader = req.headers.get('authorization');
    console.log('🔐 Auth header present:', !!authHeader);

    // Create supabase client with auth if available
    let supabaseWithAuth = supabase;
    if (authHeader) {
      supabaseWithAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: authHeader
            }
          }
        }
      );
    }

    console.log('📥 Querying Supabase for user:', user_id);
    const { data, error } = await supabaseWithAuth
      .from('calendar_data')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found - return empty state
        console.log('ℹ️ No calendar data found for user');
        return NextResponse.json({ 
          success: true, 
          data: null 
        });
      }
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: 'Failed to load calendar data' }, { status: 500 });
    }

    console.log('✅ Load successful:', data);
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('❌ Load calendar error:', error);
    return NextResponse.json({ error: 'Failed to load calendar data' }, { status: 500 });
  }
} 
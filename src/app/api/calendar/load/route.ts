import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use anon key instead of service role key for user operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
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
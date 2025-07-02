import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    // Check if environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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
    
    // Get auth header from request
    const authHeader = req.headers.get('authorization');
    console.log('🔐 Auth header present:', !!authHeader);

    // Create supabase client with auth
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

    // Get authenticated user (SECURITY: Don't trust user_id from URL)
    const { data: { user }, error: authError } = await supabaseWithAuth.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message);
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('📥 Querying Supabase for authenticated user:', user.id);
    const { data, error } = await supabaseWithAuth
      .from('calendar_data')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found - return empty state
        console.log('ℹ️ No calendar data found for user');
        return NextResponse.json({ 
          success: true, 
          data: {
            form_data: null,
            event_statuses: {},
            custom_events: {},
            result_data: null
          }
        });
      }
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: 'Failed to load calendar data' }, { status: 500 });
    }

    // Transform the data back to the format expected by the frontend
    const transformedData = {
      form_data: data.calendar_form,
      event_statuses: data.task_statuses || {},
      custom_events: data.step_statuses || {},
      result_data: data.calendar_form?.calendar_result || null
    };

    console.log('✅ Load successful:', transformedData);
    return NextResponse.json({ success: true, data: transformedData });

  } catch (error) {
    console.error('❌ Load calendar error:', error);
    return NextResponse.json({ error: 'Failed to load calendar data' }, { status: 500 });
  }
} 
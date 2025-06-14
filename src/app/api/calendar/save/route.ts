import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use anon key instead of service role key for user operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    console.log('💾 Save API called');
    const { 
      user_id, 
      form_data, 
      result_data, 
      event_statuses,
      custom_events
    } = await req.json();

    console.log('💾 Received data:', {
      user_id,
      hasFormData: !!form_data,
      hasResultData: !!result_data,
      eventStatusesCount: event_statuses ? Object.keys(event_statuses).length : 0,
      customEventsCount: custom_events ? Object.keys(custom_events).length : 0
    });

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

    // Prepare the data to save - use the correct field names for database
    const saveData = {
      user_id,
      calendar_form: form_data,
      task_statuses: {
        event_statuses: event_statuses || {},
        custom_events: custom_events || {},
        calendar_result: result_data || null
      }
    };

    console.log('💾 Prepared save data:', saveData);

    // Use upsert to insert or update
    const { data, error } = await supabaseWithAuth
      .from('calendar_data')
      .upsert(saveData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save calendar data', details: error }, { status: 500 });
    }

    console.log('✅ Save successful:', data);
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('❌ Save calendar error:', error);
    return NextResponse.json({ error: 'Failed to save calendar data' }, { status: 500 });
  }
} 
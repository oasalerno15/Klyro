import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
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

    // Prepare the data to save - match the database schema exactly
    const saveData = {
      user_id,
      calendar_form: form_data || {},
      task_statuses: event_statuses || {},
      step_statuses: custom_events || {}
    };

    // Add calendar result to form data if available
    if (result_data) {
      saveData.calendar_form = {
        ...saveData.calendar_form,
        calendar_result: result_data
      };
    }

    // Validate that calendar_form is not empty (database requires it)
    if (!saveData.calendar_form || Object.keys(saveData.calendar_form).length === 0) {
      console.log('⚠️ calendar_form is empty, adding default structure');
      saveData.calendar_form = {
        age: '',
        family: '',
        income: '',
        goals: [],
        risk: '',
        goalDescription: ''
      };
    }

    console.log('💾 Prepared save data:', JSON.stringify(saveData, null, 2));

    // Use upsert to insert or update
    const { data, error } = await supabaseWithAuth
      .from('calendar_data')
      .upsert(saveData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('❌ Detailed Supabase error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({ 
        error: 'Failed to save calendar data', 
        details: error.message,
        hint: error.hint 
      }, { status: 500 });
    }

    console.log('✅ Save successful:', data);
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('❌ Save calendar error:', error);
    return NextResponse.json({ error: 'Failed to save calendar data' }, { status: 500 });
  }
} 
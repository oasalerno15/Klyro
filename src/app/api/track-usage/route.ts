import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { featureType, increment = 1 } = await request.json();
    
    if (!featureType) {
      return NextResponse.json({ error: 'Feature type is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the existing RPC function to increment usage
    const { error } = await supabase.rpc('increment_user_usage', {
      p_user_id: user.id,
      p_feature_type: featureType,
      p_increment: increment
    });

    if (error) {
      console.error('Error tracking usage:', error);
      return NextResponse.json({ error: 'Failed to track usage' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
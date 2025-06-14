import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, featureType, increment = 1 } = await req.json();

    if (!userId || !featureType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, featureType' },
        { status: 400 }
      );
    }

    // Call the database function to increment usage
    const { data, error } = await supabase.rpc('increment_user_usage', {
      p_user_id: userId,
      p_feature_type: featureType,
      p_increment: increment,
    });

    if (error) {
      console.error('Error incrementing usage:', error);
      return NextResponse.json(
        { error: 'Failed to increment usage' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in increment usage API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
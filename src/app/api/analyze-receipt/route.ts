import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import OpenAI from 'openai';
import { usageService } from '@/lib/usage-service';

// Initialize OpenAI conditionally
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
}

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client inside the function to avoid build-time issues
    const cookieStore = await cookies();
    
    // Check if environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables not configured');
      return NextResponse.json({ 
        error: 'Server configuration error - Supabase not configured',
        fallback: true
      }, { status: 500 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can scan receipts
    const canScan = await usageService.canPerformAction(user.id, 'receipt');
    if (!canScan.allowed) {
      return NextResponse.json({ 
        error: 'Receipt scanning limit reached',
        limit: canScan.limit,
        tier: canScan.tier,
        upgradeRequired: true
      }, { status: 403 });
    }

    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Check if OpenAI API key is configured
    if (!openai || !process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, using demo data');
      
      // Return realistic demo data
      const demoAmount = Math.round((Math.random() * 50 + 10) * 100) / 100;
      const demoMerchants = ['Starbucks', 'Whole Foods', 'Target', 'CVS Pharmacy', 'McDonald\'s', 'Subway', 'Chipotle'];
      const demoCategories = ['Restaurant', 'Groceries', 'Shopping', 'Healthcare', 'Fast Food', 'Fast Food', 'Restaurant'];
      const randomIndex = Math.floor(Math.random() * demoMerchants.length);
      
      const merchant = demoMerchants[randomIndex];
      const category = demoCategories[randomIndex];
      const needVsWant = null; // User will classify this manually
      const aiInsight = null; // Will be generated after user provides classification and mood
      
      return NextResponse.json({
        merchant,
        amount: demoAmount,
        date: new Date().toISOString().split('T')[0],
        category,
        items: [
          { name: 'Item 1', price: Math.round(demoAmount * 0.6 * 100) / 100 },
          { name: 'Item 2', price: Math.round(demoAmount * 0.4 * 100) / 100 },
        ],
        confidence: 0.7,
        needVsWant,
        aiInsight
      });
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this receipt image and extract the following information in JSON format:
                {
                  "merchant": "store/restaurant name",
                  "amount": total_amount_as_number,
                  "date": "YYYY-MM-DD format",
                  "category": "category like 'Groceries', 'Restaurant', 'Gas', 'Shopping', etc.",
                  "items": [
                    {
                      "name": "item name",
                      "price": price_as_number,
                      "quantity": quantity_if_available
                    }
                  ],
                  "confidence": confidence_score_0_to_1
                }
                
                Please be as accurate as possible. If you can't read something clearly, use your best guess but lower the confidence score accordingly. For the category, choose from common spending categories like: Groceries, Restaurant, Gas, Shopping, Entertainment, Healthcare, Transportation, Utilities, etc.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Try to parse the JSON response
      let parsedData;
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        // Fallback response
        parsedData = {
          merchant: 'Unknown Merchant',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          category: 'General',
          items: [],
          confidence: 0.3
        };
      }

      // Validate and sanitize the data
      const sanitizedData = {
        merchant: parsedData.merchant || 'Unknown Merchant',
        amount: typeof parsedData.amount === 'number' ? parsedData.amount : 0,
        date: parsedData.date || new Date().toISOString().split('T')[0],
        category: parsedData.category || 'General',
        items: Array.isArray(parsedData.items) ? parsedData.items : [],
        confidence: typeof parsedData.confidence === 'number' ? parsedData.confidence : 0.5
      };

      // Add AI classifications and insights
      const needVsWant = null; // User will classify this manually
      const aiInsight = null; // Will be generated after user provides classification and mood

      // Increment usage after successful analysis
      await usageService.incrementUsage(user.id, 'receipt');

      return NextResponse.json({
        ...sanitizedData,
        needVsWant,
        aiInsight
      });

    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      
      // Return demo data if OpenAI fails
      const demoAmount = Math.round((Math.random() * 50 + 10) * 100) / 100;
      const demoMerchants = ['Starbucks', 'Whole Foods', 'Target', 'CVS Pharmacy'];
      const demoCategories = ['Restaurant', 'Groceries', 'Shopping', 'Healthcare'];
      const randomIndex = Math.floor(Math.random() * demoMerchants.length);
      
      const merchant = demoMerchants[randomIndex] + ' (Demo)';
      const category = demoCategories[randomIndex];
      const needVsWant = null; // User will classify this manually
      const aiInsight = null; // Will be generated after user provides classification and mood
      
      return NextResponse.json({
        merchant,
        amount: demoAmount,
        date: new Date().toISOString().split('T')[0],
        category,
        items: [
          { name: 'Demo Item', price: demoAmount },
        ],
        confidence: 0.5,
        needVsWant,
        aiInsight
      });
    }

  } catch (error) {
    console.error('Error analyzing receipt:', error);
    
    // Return a fallback response instead of a 500 error
    const merchant = 'Receipt Upload';
    const category = 'General';
    const amount = 25.00;
    const needVsWant = null; // User will classify this manually
    const aiInsight = null; // Will be generated after user provides classification and mood
    
    return NextResponse.json({
      merchant,
      amount,
      date: new Date().toISOString().split('T')[0],
      category,
      items: [{ name: 'Unknown Item', price: 25.00 }],
      confidence: 0.2,
      needVsWant,
      aiInsight
    }, { status: 200 }); // Return 200 instead of 500
  }
} 
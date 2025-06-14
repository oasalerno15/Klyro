import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { usageService } from '@/lib/usage-service';

// Utility function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry function with exponential backoff
async function retryOpenAIRequest(apiKey: string, requestBody: any, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Cache-Control': 'no-cache', // Prevent caching
          'Pragma': 'no-cache' // Additional cache prevention
        },
        body: JSON.stringify(requestBody)
      });

      // If successful, return the response
      if (response.ok) {
        return response;
      }

      // If it's a quota error and we have retries left, wait and retry
      if (response.status === 429 && attempt < maxRetries - 1) {
        const errorData = await response.json();
        const isQuotaError = errorData.error?.type === 'insufficient_quota' || 
                           errorData.error?.message?.includes('quota');
        
        if (isQuotaError) {
          console.log(`Quota error on attempt ${attempt + 1}, retrying in ${Math.pow(2, attempt) * 1000}ms...`);
          await delay(Math.pow(2, attempt) * 1000); // Exponential backoff: 1s, 2s, 4s
          continue;
        }
      }

      // For non-retryable errors or final attempt, return the response
      return response;
    } catch (error) {
      console.error(`Request attempt ${attempt + 1} failed:`, error);
      if (attempt === maxRetries - 1) throw error;
      await delay(Math.pow(2, attempt) * 1000);
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function POST(request: Request) {
  try {
    const { prompt, systemPrompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get user and check AI chat limits
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user can use AI chat
    const canChat = await usageService.canPerformAction(user.id, 'ai_chat');
    if (!canChat.allowed) {
      return NextResponse.json({ 
        error: 'AI chat limit reached',
        limit: canChat.limit,
        tier: canChat.tier,
        upgradeRequired: true
      }, { status: 403 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Get user's transaction data from Supabase
    let transactionContext = '';
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('name, amount, date, category, need_vs_want, mood_at_purchase')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(20);
      
      if (!error && transactions && transactions.length > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTransactions = transactions.filter((t: any) => t.date === todayStr);
        const recentTransactions = transactions.slice(0, 10);
        
        transactionContext = `
USER'S RECENT TRANSACTION DATA:

Today's Transactions (${todayStr}):
${todayTransactions.length > 0 
  ? todayTransactions.map((t: any) => `- ${t.name}: $${Math.abs(t.amount)} (${t.need_vs_want || 'unclassified'}) ${t.mood_at_purchase ? `[Mood: ${t.mood_at_purchase}]` : ''}`).join('\n')
  : 'No transactions today'}

Recent Transactions (last 10):
${recentTransactions.map((t: any) => `- ${t.date}: ${t.name} - $${Math.abs(t.amount)} (${t.need_vs_want || 'unclassified'}) ${t.mood_at_purchase ? `[Mood: ${t.mood_at_purchase}]` : ''}`).join('\n')}

Total transactions available: ${transactions.length}
`;
      } else {
        transactionContext = '\nUSER TRANSACTION DATA: No transactions found or unable to access data.\n';
      }
    } catch (dbError) {
      console.warn('Could not fetch transaction data:', dbError);
      transactionContext = '\nUSER TRANSACTION DATA: Unable to fetch transaction data.\n';
    }

    const defaultSystemPrompt = `You are a helpful AI financial assistant. Provide clear, actionable advice based on the user's financial situation. Keep responses concise but informative.`;

    const fullPrompt = transactionContext ? 
      `Context: ${transactionContext}\n\nUser Question: ${prompt}` : 
      prompt;

    const requestBody = {
      model: 'gpt-4o-mini', // Ultra-cheap model: ~$0.00015 per 1K tokens (vs gpt-3.5-turbo ~$0.001)
      messages: [
        {
          role: 'system',
          content: systemPrompt || defaultSystemPrompt
        },
        { role: 'user', content: fullPrompt }
      ],
      temperature: 0.8,
      max_tokens: 300 // Reduced from 500 to save costs while keeping quality
    };

    // Use retry logic for the OpenAI request
    const response = await retryOpenAIRequest(apiKey, requestBody);

    if (!response.ok) {
      const errorData = await response.json();
      
      let errorMessage = 'Unknown error';
      let debugInfo: {
        status: number;
        type?: string;
        message: string;
        timestamp: string;
        suggestions: string[];
        retryRecommendation?: string;
      } = {
        status: response.status,
        message: '',
        timestamp: new Date().toISOString(),
        suggestions: []
      };
      
      if (response.status === 429) {
        const errorType = errorData.error?.type;
        const errorMsg = errorData.error?.message || '';
        
        debugInfo.type = errorType;
        debugInfo.message = errorMsg;
        
        if (errorType === 'insufficient_quota' || errorMsg.includes('quota')) {
          errorMessage = '🚨 QUOTA STILL PENDING: OpenAI is processing your payment. This usually takes 2-4 hours.';
          debugInfo.retryRecommendation = 'Payment activation in progress - try again in 1-2 hours';
          debugInfo.suggestions = [
            '⏳ MOST LIKELY: Payment processing delay (2-4 hours after topping up)',
            '🔄 Try again in 1-2 hours - this usually resolves automatically',
            '🎮 Test at https://platform.openai.com/playground first',
            '🔑 If still failing after 4 hours, create a new API key',
            '💳 Verify payment completed at https://platform.openai.com/account/billing'
          ];
        } else if (errorType === 'rate_limit_exceeded' || errorMsg.includes('rate')) {
          errorMessage = '⏱️ RATE LIMIT: Too many requests per minute. Please wait and try again.';
          debugInfo.suggestions = [
            'Wait 60 seconds before making another request',
            'Consider upgrading to a higher usage tier',
            'Implement request queuing in your application'
          ];
        } else {
          errorMessage = `Rate/quota limit: ${errorMsg}`;
          debugInfo.suggestions = [
            'Check your OpenAI dashboard for specific limits',
            'Verify your account is in good standing'
          ];
        }
      } else if (response.status === 401) {
        errorMessage = 'Invalid API key. Please check your OpenAI configuration.';
        debugInfo.message = errorData.error?.message || 'Invalid API key';
        debugInfo.suggestions = [
          'Verify your API key is correct',
          'Check that the key hasn\'t expired',
          'Ensure the key starts with "sk-"'
        ];
      } else {
        errorMessage = errorData.error?.message || 'Unknown error';
        debugInfo.message = errorMessage;
      }
      
      console.error('OpenAI API Error after retries:', {
        status: response.status,
        error: errorData,
        debug: debugInfo
      });
      
      return NextResponse.json(
        { 
          error: `OpenAI API error: ${errorMessage}`,
          debug: debugInfo,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Increment usage after successful AI response
    await usageService.incrementUsage(user.id, 'ai_chat');
    
    return NextResponse.json({ result: data.choices[0]?.message?.content || '' });
  } catch (error: any) {
    console.error('Error in ask-ai route:', error);
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to process request - server error' },
      { status: 500 }
    );
  }
} 
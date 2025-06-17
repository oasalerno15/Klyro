import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { usageService } from '@/lib/usage-service';

// Utility function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface Transaction {
  name: string;
  amount: number;
  date: string;
  category: string;
  need_vs_want?: string | null;
  mood_at_purchase?: string | null;
}

// Retry function with exponential backoff
async function retryOpenAIRequest(apiKey: string, requestBody: Record<string, unknown>, maxRetries = 3) {
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
        const errorData = await response.json() as Record<string, unknown>;
        const errorObj = errorData.error as Record<string, unknown> | undefined;
        const isQuotaError = errorObj?.type === 'insufficient_quota' || 
                           (typeof errorObj?.message === 'string' && errorObj.message.includes('quota'));
        
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
        const todayTransactions = (transactions as Transaction[]).filter((t: Transaction) => t.date === todayStr);
        const recentTransactions = transactions.slice(0, 10) as Transaction[];
        
        transactionContext = `
USER'S RECENT TRANSACTION DATA:

Today's Transactions (${todayStr}):
${todayTransactions.length > 0 
  ? todayTransactions.map((t: Transaction) => `- ${t.name}: $${Math.abs(t.amount)} (${t.need_vs_want || 'unclassified'}) ${t.mood_at_purchase ? `[Mood: ${t.mood_at_purchase}]` : ''}`).join('\n')
  : 'No transactions today'}

Recent Transactions (last 10):
${recentTransactions.map((t: Transaction) => `- ${t.date}: ${t.name} - $${Math.abs(t.amount)} (${t.need_vs_want || 'unclassified'}) ${t.mood_at_purchase ? `[Mood: ${t.mood_at_purchase}]` : ''}`).join('\n')}

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
      const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
      
      // Handle specific error cases
      if (response.status === 403 && errorData.error === 'AI chat limit reached') {
        return NextResponse.json({ 
          error: 'AI chat limit reached',
          limit: canChat.limit,
          tier: canChat.tier,
          upgradeRequired: true
        }, { status: 403 });
      }
      
      if (response.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      if (response.status === 429) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
      
      if (response.status >= 500) {
        return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
      }
      
      // For other errors, throw to be handled by the catch block
      throw new Error(
        `API request failed with status ${response.status}: ${
          (errorData.error as string) || 'Unknown error'
        }`
      );
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    if (!data || !data.choices || !data.choices[0]?.message?.content) {
      console.error('Invalid API response format:', data);
      return NextResponse.json({ error: 'Invalid response format' }, { status: 500 });
    }
    
    // Increment usage after successful AI chat
    await usageService.incrementUsage(user.id, 'ai_chat');
    
    return NextResponse.json({ result: data.choices[0].message.content || "I couldn't generate a response. Please try again." });
  } catch (error: unknown) {
    console.error('Error generating insight:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle specific error types
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out' },
        { status: 408 }
      );
    }
    
    if (errorMessage.includes('NetworkError')) {
    return NextResponse.json(
        { error: 'Network error occurred' },
        { status: 503 }
      );
    }

    const debugInfo = {
      status: 500,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      suggestions: ['Please try again later', 'Contact support if the problem persists']
    };
    
    return NextResponse.json({
      error: errorMessage || 'Internal server error',
      debug: debugInfo
    }, { status: 500 });
  }
} 
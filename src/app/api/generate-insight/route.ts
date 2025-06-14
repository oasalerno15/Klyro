import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { validateEnvironment } from '@/lib/env-validation';

// Validate environment on module load
let envStatus: { hasOpenAI: boolean; hasSupabase: boolean };
try {
  envStatus = validateEnvironment();
} catch (error) {
  console.error('Environment validation failed:', error);
  envStatus = { hasOpenAI: false, hasSupabase: false };
}

const openai = envStatus.hasOpenAI ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Sophisticated fallback insights based on merchant patterns, mood, and context
const generateContextualFallback = (merchant: string, category: string, amount: number, mood: string | null, needVsWant: string | null) => {
  const merchantLower = merchant.toLowerCase();
  const moodLower = mood?.toLowerCase().split(':')[0] || '';
  
  // Merchant-specific niche insights
  if (merchantLower.includes('starbucks') || merchantLower.includes('coffee')) {
    if (moodLower.includes('stressed') || moodLower.includes('anxious')) {
      return `Your $${amount} coffee run during stress might be your nervous system seeking warmth and ritual rather than caffeine. Next time you feel this way, try holding a warm cup of herbal tea for 3 minutes while taking deep breaths - it often provides the same soothing effect without the expense or caffeine crash.`;
    }
    if (amount > 8) {
      return `That $${amount} coffee suggests you might have upgraded or added extras when feeling ${moodLower || 'neutral'}. Consider creating a "coffee ceremony" at home - grinding beans, steaming milk, taking time to savor - it transforms an expensive habit into a mindful ritual that costs 80% less.`;
    }
    return `Coffee purchases when feeling ${moodLower || 'content'} often signal a desire for social connection or mental transition. Try visiting a coffee shop and just sitting with a book or journal instead of buying - you'll get the ambiance and social energy that you're actually craving.`;
  }
  
  if (merchantLower.includes('amazon') || merchantLower.includes('shopping')) {
    if (moodLower.includes('sad') || moodLower.includes('down')) {
      return `Shopping for $${amount} while feeling down often indicates emotional repair-seeking through acquisition. Instead, try "shopping" your own belongings - rediscover items you forgot you had, rearrange your space, or give something away - this activates the same dopamine pathways as buying new things.`;
    }
    if (needVsWant === 'Want' && amount > 30) {
      return `This $${amount} want-purchase might be your brain seeking novelty during ${moodLower || 'routine'} feelings. Create a "curiosity fund" - set aside $5 every time you resist an impulse buy, then once monthly, deliberately spend it on something genuinely surprising or educational.`;
    }
    return `Online shopping when feeling ${moodLower || 'neutral'} can become mindless. Try the "cart meditation" technique - add items you want to your cart, then wait 24 hours while asking yourself: "What feeling am I trying to purchase?" Often the act of selecting is enough to satisfy the urge.`;
  }
  
  if (merchantLower.includes('uber') || merchantLower.includes('lyft') || category.toLowerCase().includes('transport')) {
    if (moodLower.includes('tired') || moodLower.includes('exhausted')) {
      return `That $${amount} ride while tired suggests your energy levels are dictating transportation choices. Consider keeping a "fatigue emergency kit" - snacks, water, and a playlist that energizes you - so you can assess if you truly need the ride or just need a moment to reset.`;
    }
    if (amount > 15) {
      return `Expensive rides often happen during emotional peaks - whether rushing, avoiding discomfort, or feeling scattered. Next time, try the "5-minute rule": set a timer before booking and use that time to check if there's a creative alternative or if this expense aligns with your actual priorities.`;
    }
    return `Transportation spending when feeling ${moodLower || 'neutral'} might indicate a pattern of trading money for time. Consider mapping out which trips are truly worth the premium and which are just habit - this awareness alone often reduces unnecessary ride expenses by 40%.`;
  }
  
  if (merchantLower.includes('grocery') || merchantLower.includes('food') || merchantLower.includes('market')) {
    if (moodLower.includes('stressed') || moodLower.includes('overwhelmed')) {
      return `Grocery shopping for $${amount} while stressed often leads to "decision fatigue" purchases - convenient but expensive items. Try the "grounding cart" method: before shopping, touch three different textures (produce, packages, metal) to reconnect with your senses and make more intentional choices.`;
    }
    if (needVsWant === 'Need' && amount > 60) {
      return `Large necessary grocery trips when feeling ${moodLower || 'neutral'} suggest you might be stocking up due to underlying anxiety about scarcity. Practice "abundance thinking" by buying exactly what you need for 3 days, then reflect on how it feels to trust that food will always be available.`;
    }
    return `Food shopping patterns often reveal our relationship with nourishment and control. Next time you shop while feeling ${moodLower || 'neutral'}, try selecting one item that's purely for joy rather than necessity - it helps balance the practical with the pleasurable in a mindful way.`;
  }
  
  if (merchantLower.includes('restaurant') || merchantLower.includes('dining') || category.toLowerCase().includes('restaurant')) {
    if (moodLower.includes('lonely') || moodLower.includes('sad')) {
      return `Dining out for $${amount} while feeling lonely suggests you might be purchasing social atmosphere along with food. Consider bringing a journal or book to a café instead - you'll get the social energy and stimulation for the cost of a beverage while practicing comfortable solitude.`;
    }
    if (moodLower.includes('excited') || moodLower.includes('celebratory')) {
      return `Celebrating with a $${amount} meal shows you associate food with marking meaningful moments. Create non-food celebration rituals too - like taking a photo of the sunset, writing yourself a congratulatory note, or calling someone you love - so joy doesn't always require spending.`;
    }
    return `Restaurant purchases when feeling ${moodLower || 'neutral'} often signal a desire for someone else to take care of you. Honor this need by creating "care rituals" at home - set the table nicely, light a candle, plate your food thoughtfully - it satisfies the nurturing need for less.`;
  }
  
  // General mood-based insights for any merchant
  if (moodLower.includes('anxious') || moodLower.includes('worried')) {
    return `Spending $${amount} at ${merchant} while anxious suggests money might feel like a solution to internal turbulence. Try the "anxiety spending pause" - when worried, write down exactly what you're hoping this purchase will fix or change. Often seeing it written reveals the real need that money can't address.`;
  }
  
  if (moodLower.includes('happy') || moodLower.includes('excited')) {
    return `This $${amount} purchase during good feelings shows you reward positive emotions with spending. Channel that joy into "happiness investing" instead - use positive moods to do things that compound over time, like learning something new, connecting with friends, or organizing your space.`;
  }
  
  if (moodLower.includes('bored') || moodLower.includes('restless')) {
    return `Shopping for $${amount} at ${merchant} while bored indicates you might be purchasing stimulation. Create a "boredom toolkit" - unusual activities that cost nothing but provide novelty, like exploring a new neighborhood, rearranging furniture, or learning origami from YouTube videos.`;
  }
  
  // Amount-based insights
  if (amount > 100) {
    return `Large purchases like this $${amount} one often happen when we're seeking to solve complex feelings with material solutions. Before your next significant expense, try "emotional archaeology" - dig into what you're really hoping this purchase will change about your life or feelings.`;
  }
  
  if (amount < 10) {
    return `Small purchases like this $${amount} one can be "death by a thousand cuts" for your financial awareness. These micro-decisions often reflect larger patterns - notice if small spending happens during specific emotional states or times of day, then experiment with alternative tiny rituals.`;
  }
  
  // Default contextual fallback
  return `Your $${amount} purchase at ${merchant} while feeling ${moodLower || 'neutral'} reveals the intricate dance between emotions and money decisions. Try "purchase archaeology" next time - pause and ask: "What am I hoping this will change about how I feel right now?" The answer often points to what you actually need.`;
};

export async function POST(request: NextRequest) {
  try {
    const { merchant, category, amount, mood, needVsWant } = await request.json();

    if (!merchant || !category || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate needVsWant if provided
    const validNeedVsWant = (needVsWant === 'Need' || needVsWant === 'Want') ? needVsWant : null;

    // Fallback insight if no OpenAI API key or OpenAI client not initialized
    if (!envStatus.hasOpenAI || !openai) {
      console.log('💡 Using sophisticated fallback insights (OpenAI not available)');
      return NextResponse.json({ 
        insight: generateContextualFallback(merchant, category, amount, mood, validNeedVsWant)
      });
    }

    try {
      const moodContext = mood ? mood.split(':') : ['Not specified', ''];
      const moodName = moodContext[0] || 'Not specified';
      const moodDescription = moodContext[1] || '';
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a financial behavior therapist with deep expertise in emotional psychology and behavioral economics. You help people understand the hidden emotional drivers behind their spending decisions and offer highly specific, niche interventions.

Your role is NOT to give generic budgeting advice like "track your spending" or "make a budget." Instead, you provide unique, context-specific suggestions that reveal unexpected connections between emotions, behavior, and money.

Guidelines:
- Write like a wise, emotionally intelligent therapist who understands money psychology
- Offer ONE specific, unusual, actionable technique that's tailored to this exact scenario
- Avoid generic advice about budgeting, tracking, or monitoring
- Focus on the emotional/psychological patterns revealed by this purchase
- Be insightful about what this spending pattern might indicate about deeper needs
- Suggest creative alternatives or reframes that address the root emotional need
- Use natural, flowing language - never robotic or clinical
- NO emojis or bullet points
- Keep responses to 2-3 sentences maximum
- Make each response feel handcrafted for this specific person and situation`
          },
          {
            role: "user",
            content: `Merchant: ${merchant}
Category: ${category}
Amount: $${amount}
Classification: ${validNeedVsWant || 'Not specified'}
Mood: ${moodName}${moodDescription ? ` (${moodDescription})` : ''}

Generate a deeply personalized insight that reveals something unexpected about this purchase pattern and offers a unique, niche suggestion for addressing the underlying emotional need.`
          }
        ],
        max_tokens: 150,
        temperature: 0.8,
      });

      const insight = response.choices[0]?.message?.content?.trim() || generateContextualFallback(merchant, category, amount, mood, validNeedVsWant);
      
      return NextResponse.json({ insight });

    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError?.message || openaiError);
      
      // Use sophisticated fallback instead of simple error message
      return NextResponse.json({ 
        insight: generateContextualFallback(merchant, category, amount, mood, validNeedVsWant)
      });
    }

  } catch (error: any) {
    console.error('Error generating insight:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to generate insight', details: error?.message || 'Unknown error' }, 
      { status: 500 }
    );
  }
} 
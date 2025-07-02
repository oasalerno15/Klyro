import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { transactions, recentMoods, timeframe = '7d', pieChartData } = await request.json();

    // If no transactions, return empty insights
    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ insights: [] });
    }

    // Analyze user's recent transaction patterns
    const totalSpent = transactions.reduce((sum: number, tx: any) => sum + Math.abs(tx.amount), 0);
    const transactionCount = transactions.length;
    const categories = transactions.map((tx: any) => tx.category).flat();
    const avgMood = recentMoods?.length > 0 ? recentMoods.reduce((sum: number, mood: number) => sum + mood, 0) / recentMoods.length : null;

    // Analyze top merchants/categories
    const merchantAnalysis = transactions.reduce((acc: any, tx: any) => {
      const merchant = tx.name || 'Unknown';
      acc[merchant] = (acc[merchant] || 0) + Math.abs(tx.amount);
      return acc;
    }, {});

    const categoryAnalysis = transactions.reduce((acc: any, tx: any) => {
      const category = Array.isArray(tx.category) ? tx.category[0] : tx.category || 'General';
      acc[category] = (acc[category] || 0) + Math.abs(tx.amount);
      return acc;
    }, {});

    const prompt = `You are an AI financial behavior analyst. Based on this REAL user data, generate 3-4 highly specific insights:

ACTUAL USER DATA (${timeframe}):
- Total spent: $${totalSpent.toFixed(2)}
- Transactions: ${transactionCount}
- Average mood: ${avgMood ? avgMood.toFixed(1) + '/10' : 'Not tracked'}
- Top categories: ${Object.entries(categoryAnalysis).slice(0, 3).map(([cat, amt]: [string, any]) => `${cat}: $${amt.toFixed(2)}`).join(', ')}
- Top merchants: ${Object.entries(merchantAnalysis).slice(0, 3).map(([merchant, amt]: [string, any]) => `${merchant}: $${amt.toFixed(2)}`).join(', ')}

PIE CHART ANALYSIS:
- Mood-driven spending: ${pieChartData?.moodDrivenPercent || 0}% of total spending ($${pieChartData?.moodDrivenSpending?.toFixed(2) || '0'})
- Want vs Need ratio: ${pieChartData?.wantPercent || 0}% wants, ${pieChartData?.needPercent || 0}% needs
- Transaction frequency: ${pieChartData?.transactionsPerWeek || 0} transactions/week (${pieChartData?.activityLevel || 'Unknown'})
- Need spending: $${pieChartData?.needSpending?.toFixed(2) || '0'}
- Want spending: $${pieChartData?.wantSpending?.toFixed(2) || '0'}

Generate insights that combine TRANSACTION DATA with PIE CHART ANALYSIS. Include:
1. Behavioral patterns linking mood states to specific spending categories
2. Want vs Need spending insights with actual percentages and merchant patterns
3. Transaction frequency analysis and what it reveals about spending habits
4. Cross-analysis between mood-driven spending and merchant preferences

Each insight MUST:
- Use REAL data from above (actual merchant names, real percentages, exact amounts)
- Combine transaction details with pie chart behavioral analysis
- Be under 65 characters for ticker display
- Include specific numbers/percentages
- NO EMOJIS - clean professional text only

Format as JSON array. Focus on BEHAVIORAL INSIGHTS that connect pie chart patterns to actual spending.

Return only the JSON array, no other text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.3, // Lower temperature for more factual insights
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    // Parse the JSON response
    let insights;
    try {
      insights = JSON.parse(content);
    } catch (parseError) {
      // Fallback - no fake insights, just wait for real data
      insights = [];
    }

    return NextResponse.json({ insights });

  } catch (error) {
    console.error('Error generating ticker insights:', error);
    
    // Return empty array instead of fake insights
    return NextResponse.json({ insights: [] });
  }
} 
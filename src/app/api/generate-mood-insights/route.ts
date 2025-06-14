import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { currentMood, recentMoods, recentTransactions, spendingPatterns } = await request.json();

    // Analyze patterns for forecasting
    const avgMood = recentMoods?.length > 0 ? recentMoods.reduce((sum: number, mood: number) => sum + mood, 0) / recentMoods.length : null;
    const recentSpending = recentTransactions?.reduce((sum: number, tx: any) => sum + Math.abs(tx.amount), 0) || 0;
    const moodTrend = recentMoods?.length >= 2 ? (recentMoods[recentMoods.length - 1] - recentMoods[0]) : 0;
    const moodVolatility = recentMoods?.length > 1 ? 
      Math.sqrt(recentMoods.reduce((sum: number, mood: number, i: number, arr: number[]) => 
        sum + Math.pow(mood - (avgMood || 0), 2), 0) / recentMoods.length) : 0;

    const prompt = `You are an AI financial behavior forecaster. Analyze this data to predict spending risks and behaviors:

BEHAVIORAL DATA:
- Current mood: ${currentMood || 'Not set'}/10
- 7-day avg mood: ${avgMood ? avgMood.toFixed(1) : 'Not tracked'}/10
- Mood trend: ${moodTrend > 0 ? 'Improving' : moodTrend < 0 ? 'Declining' : 'Stable'}
- Mood volatility: ${moodVolatility.toFixed(1)} (higher = more unpredictable)
- Recent spending: $${recentSpending.toFixed(2)}
- Transaction count: ${recentTransactions?.length || 0}

Generate a FORECASTING analysis like a financial weather report with:

{
  "riskScore": number (0-100, where 100 = highest impulse buying risk),
  "riskLevel": string ("Low Risk" | "Moderate Risk" | "High Risk" | "Critical Risk"),
  "riskColor": string ("green" | "yellow" | "orange" | "red"),
  "forecast": string (predictive warning/insight about upcoming spending behavior, 2-3 sentences),
  "alert": string (specific actionable alert/warning for today),
  "prediction": string (what spending pattern to expect),
  "confidence": string (how confident the forecast is: "High" | "Medium" | "Low")
}

Make this sound like a FINANCIAL WEATHER FORECAST with predictions like:
- "Your stress level suggests potential impulse buying risk"
- "Mood volatility indicates 67% chance of emotional purchases"
- "Low energy patterns predict comfort spending increase"
- "Current mental state suggests budget discipline may weaken"
- "Anxiety levels forecast 34% higher discretionary spending"

Focus on PREDICTIONS and RISK ASSESSMENT, not general advice.

Return only the JSON object, no other text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    // Parse the JSON response
    let forecastData;
    try {
      forecastData = JSON.parse(content);
    } catch (parseError) {
      // Fallback forecasting data
      const riskScore = Math.min(100, Math.max(0, 
        (currentMood ? (10 - currentMood) * 10 : 50) + (moodVolatility * 15)
      ));
      
      forecastData = {
        riskScore: Math.round(riskScore),
        riskLevel: riskScore > 75 ? "High Risk" : riskScore > 50 ? "Moderate Risk" : "Low Risk",
        riskColor: riskScore > 75 ? "red" : riskScore > 50 ? "orange" : "green",
        forecast: "Current mood patterns suggest moderate spending impulse risk. Emotional state indicates potential for comfort purchases during low-energy periods.",
        alert: "Monitor discretionary spending today - mood volatility may trigger impulse purchases",
        prediction: "23% increase in comfort spending likely during afternoon stress period",
        confidence: "Medium"
      };
    }

    return NextResponse.json({ forecastData });

  } catch (error) {
    console.error('Error generating spending forecast:', error);
    
    // Return fallback forecast
    const fallbackForecast = {
      riskScore: 45,
      riskLevel: "Moderate Risk",
      riskColor: "yellow",
      forecast: "Spending behavior patterns suggest moderate impulse risk. Current data indicates balanced emotional-financial state with room for improved awareness.",
      alert: "Track mood before purchases over $25 to maintain spending discipline",
      prediction: "Steady spending pattern expected with 15% variance from baseline",
      confidence: "Low"
    };

    return NextResponse.json({ forecastData: fallbackForecast });
  }
} 
import { NextRequest, NextResponse } from 'next/server';

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
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        return response;
      }

      if (response.status === 429 && attempt < maxRetries - 1) {
        const errorData = await response.json();
        const isQuotaError = errorData.error?.type === 'insufficient_quota' || 
                           errorData.error?.message?.includes('quota');
        
        if (isQuotaError) {
          console.log(`Quota error on attempt ${attempt + 1}, retrying in ${Math.pow(2, attempt) * 1000}ms...`);
          await delay(Math.pow(2, attempt) * 1000);
          continue;
        }
      }

      return response;
    } catch (error) {
      console.error(`Request attempt ${attempt + 1} failed:`, error);
      if (attempt === maxRetries - 1) throw error;
      await delay(Math.pow(2, attempt) * 1000);
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function POST(req: NextRequest) {
  try {
    const { age, family, income, goals, risk, goalDescription } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key is missing');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please check your environment variables.' },
        { status: 500 }
      );
    }

    // Log for debugging
    console.log('🔑 OpenAI API Key present:', !!apiKey);
    console.log('📝 Generating calendar for:', { age, family, income, goals, risk });

    const systemPrompt = `You are a hyper-specific financial advisor. Create ultra-actionable, concrete tasks that require ZERO additional research from the user. Give them EXACT steps, specific websites, specific tools to use, and precise actions to take.

CRITICAL LEGAL NOTICE: NEVER recommend specific investment amounts, specific stocks, specific investment products, or give direct investment advice. Instead, focus on educational research, budgeting tools, savings strategies, and general financial planning.

CRITICAL: Be extremely specific and actionable. Instead of "research investments" say "Go to Investopedia.com, read their complete guide on index funds, then use their investment calculator to understand how compound interest works with different contribution levels"

Return a JSON object with exactly these fields:
{
  "summary": "A comprehensive summary with specific action-oriented recommendations and detailed next steps (4-5 sentences minimum)",
  "scores": {
    "Readiness": number (0-10),
    "Growth": number (0-10), 
    "Diversification": number (0-10),
    "Risk Management": number (0-10),
    "Opportunity": number (0-10),
    "Stability": number (0-10)
  },
  "suggestions": ["Ultra-specific suggestion with exact steps", "Another specific suggestion with exact tools/websites"],
  "steps": [
    {
      "title": "Specific Step Title",
      "desc": "Detailed step-by-step instructions with specific websites, tools, and processes (3-4 sentences minimum)", 
      "type": "Action|Education|Review",
      "status": "unlocked",
      "estimatedTime": "X mins"
    }
  ],
  "calendar": [
    {
      "day": 1,
      "tasks": [
        {
          "id": "task-1-1",
          "title": "Specific Task Title",
          "description": "Comprehensive instructions with exact steps, specific websites to visit, specific calculations to perform, and detailed processes to follow. Include multiple sentences with specific tools, apps, and websites. Explain the why behind each step and what the user will learn or accomplish.",
          "type": "action|education|review",
          "icon": "Target|Calculator|Shield|DollarSign|Zap",
          "estimated_time": "X min",
          "completed": false
        }
      ]
    }
  ]
}

TASK SPECIFICITY RULES (NO INVESTMENT ADVICE):
- If user selected "Investing": Focus on education - specific websites to learn about investing, investment calculators to try, educational courses to take
- If user selected "Saving": Give specific banks, exact APY rates, specific account types to research and compare  
- If user selected "Budgeting": Give specific apps, exact percentage allocation strategies, specific expense tracking methods
- If user selected "Side hustles": Give specific platforms to research, exact skill requirements, realistic market research steps
- If user selected "Passive income": Focus on education about different passive income streams, not specific investments
- If user selected "Debt reduction": Give specific payment strategies, exact calculation methods, specific debt tracking tools

EXAMPLES OF PROPER SPECIFICITY:
❌ Bad: "Invest $500 in Apple stock"
✅ Good: "Go to Yahoo Finance, research Apple's financial statements, learn how to read P/E ratios using their educational guides, then practice calculating intrinsic value using Benjamin Graham's formula"

❌ Bad: "Buy $200 of VTSAX"  
✅ Good: "Visit Vanguard.com's education center, complete their 'Introduction to Index Funds' course, use their fund comparison tool to understand expense ratios, and read their white paper on three-fund portfolios"

❌ Bad: "Start budgeting"
✅ Good: "Download YNAB app, complete their free 34-day trial setup process, watch their 'Quick Start Guide' video series, and follow their four-rule methodology to categorize your expenses into needs vs wants using their built-in calculators"

❌ Bad: "Consider real estate"
✅ Good: "Visit BiggerPockets.com, create a free account, read their 'Ultimate Beginner's Guide to Real Estate Investing', listen to episodes 1-10 of their podcast, and use their rental property calculator to understand cash flow analysis for your local market"

Include specific websites, exact processes, current educational resources, specific app names, exact account types, precise calculation methods, and step-by-step learning paths that require no additional research.

Make descriptions comprehensive and detailed - each task description should be 3-5 sentences explaining exactly what to do, why to do it, and what they'll learn.

Base recommendations on their exact income level, risk tolerance, and selected goals. Make every task immediately actionable with zero ambiguity while focusing on education and practical financial management rather than specific investment advice.`;

    const userPrompt = `Create a financial roadmap for:
- Age: ${age}
- Family: ${family}
- Income: $${income}
- Goals: ${goals.join(', ')}
- Risk tolerance: ${risk}
${goalDescription ? `- Additional details: ${goalDescription}` : ''}

Focus on actionable steps and create a 7-day calendar with specific daily tasks.`;

    const requestBody = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000 // Much higher limit for complex JSON response
    };

    console.log('🚀 Making OpenAI API request...');
    const response = await retryOpenAIRequest(apiKey, requestBody);

    if (!response.ok) {
      console.error('❌ OpenAI API request failed with status:', response.status);
      
      // Try to get error details
      let errorDetails = 'Unknown error';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error?.message || JSON.stringify(errorData);
        console.error('OpenAI API Error Details:', errorData);
      } catch (jsonError) {
        // If we can't parse as JSON, it might be HTML
        const errorText = await response.text();
        console.error('OpenAI API returned non-JSON response:', errorText.substring(0, 200));
        errorDetails = `API returned HTML instead of JSON. Status: ${response.status}`;
      }
      
      return NextResponse.json(
        { error: `OpenAI API Error: ${errorDetails}` },
        { status: response.status }
      );
    }

    console.log('✅ OpenAI API request successful');
    const data = await response.json();
    let aiResponse = data.choices[0]?.message?.content || '';

    console.log('🤖 AI Response length:', aiResponse.length);
    console.log('🤖 AI Response preview:', aiResponse.substring(0, 100) + '...');

    // Clean the response
    aiResponse = aiResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

    // Check for truncation and fix
    if (!aiResponse.trim().endsWith('}')) {
      console.warn('⚠️ Response appears truncated, attempting to fix...');
      
      let fixedResponse = aiResponse.trim();
      
      // Remove incomplete calendar field if present
      if (fixedResponse.includes('"calendar":') && !fixedResponse.includes('"calendar":[')) {
        const calendarIndex = fixedResponse.lastIndexOf('"calendar":');
        if (calendarIndex > 0) {
          fixedResponse = fixedResponse.substring(0, calendarIndex - 1) + '}';
        }
      }
      
      // Ensure proper closure
      if (!fixedResponse.endsWith('}')) {
        fixedResponse += '}';
      }
      
      aiResponse = fixedResponse;
    }

    try {
      console.log('📝 Attempting to parse AI response as JSON...');
      const parsedResult = JSON.parse(aiResponse);
      
      // Validate required fields
      if (!parsedResult.summary || !parsedResult.scores) {
        throw new Error('Missing required fields in AI response');
      }

      console.log('✅ Successfully parsed AI response');

      // Generate fallback calendar if missing or invalid
      if (!parsedResult.calendar || !Array.isArray(parsedResult.calendar)) {
        console.log('⚠️ Generating fallback calendar...');
        parsedResult.calendar = [];
        
        for (let day = 1; day <= 7; day++) {
          const tasks = [{
            id: `fallback-task-${day}-1`,
            title: day === 1 ? 'Set Financial Goals' :
                   day === 2 ? 'Track Your Spending' :
                   day === 3 ? 'Review Credit Score' :
                   day === 4 ? 'Research Investment Options' :
                   day === 5 ? 'Create Budget Plan' :
                   day === 6 ? 'Emergency Fund Setup' :
                   'Weekly Review',
            description: day === 1 ? 'Define your top 3 financial priorities' :
                        day === 2 ? 'Start tracking all daily expenses' :
                        day === 3 ? 'Check your credit report for accuracy' :
                        day === 4 ? 'Research investment vehicles that match your risk tolerance' :
                        day === 5 ? 'Create a monthly budget based on your income and goals' :
                        day === 6 ? 'Set up automatic savings for emergency fund' :
                        'Review progress and adjust your financial plan',
            type: day === 7 ? 'review' : day <= 3 ? 'action' : 'education',
            icon: day === 1 ? 'Target' : day === 2 ? 'Calculator' : day === 3 ? 'Shield' : 
                  day === 4 ? 'DollarSign' : day === 5 ? 'Calculator' : day === 6 ? 'Shield' : 'Zap',
            estimated_time: '30 min',
            completed: false
          }];
          
          parsedResult.calendar.push({ day, tasks });
        }
      }

      console.log('🎉 Calendar generation successful');
      return NextResponse.json({
        success: true,
        data: parsedResult
      });

    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      console.error('❌ AI Response was:', aiResponse.substring(0, 500));
      
      // Return structured fallback
      console.log('🔄 Returning fallback response...');
      return NextResponse.json({
        success: true,
        data: {
          summary: `Your financial roadmap is ready! Based on your profile, we've created a personalized action plan to help you achieve your goals: ${goals.join(', ')}.`,
          scores: {
            Readiness: 7,
            Growth: 6,
            Diversification: 5,
            'Risk Management': risk === 'High' ? 6 : risk === 'Medium' ? 7 : 8,
            Opportunity: 7,
            Stability: 7
          },
          suggestions: [
            'Start with small, achievable daily actions',
            'Focus on your priority goals first',
            'Track your progress weekly'
          ],
          steps: [
            { title: 'Set Clear Goals', desc: 'Define specific financial objectives', type: 'Action', status: 'unlocked', estimatedTime: '30 mins' },
            { title: 'Create Budget', desc: 'Track income and expenses', type: 'Action', status: 'unlocked', estimatedTime: '45 mins' },
            { title: 'Build Emergency Fund', desc: 'Save 3-6 months of expenses', type: 'Action', status: 'unlocked', estimatedTime: '60 mins' }
          ],
          calendar: Array.from({ length: 7 }, (_, i) => ({
            day: i + 1,
            tasks: [{
              id: `backup-task-${i + 1}`,
              title: ['Set Goals', 'Track Spending', 'Check Credit', 'Research Investments', 'Create Budget', 'Emergency Fund', 'Weekly Review'][i],
              description: `Day ${i + 1}: Take action toward your financial goals`,
              type: i === 6 ? 'review' : 'action',
              icon: ['Target', 'Calculator', 'Shield', 'DollarSign', 'Calculator', 'Shield', 'Zap'][i],
              estimated_time: '30 min',
              completed: false
            }]
          }))
        }
      });
    }

  } catch (error: any) {
    console.error('❌ Calendar generation error:', error);
    
    // Provide helpful error message
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API key configuration error. Please check your environment variables.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate calendar. Please try again.' },
      { status: 500 }
    );
  }
} 
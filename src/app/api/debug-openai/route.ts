import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'OpenAI API key not configured',
        status: 'missing_key'
      });
    }

    // Check if key format is correct
    const keyFormat = apiKey.startsWith('sk-') ? 'valid_format' : 'invalid_format';
    
    // Test a simple API call
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const debugInfo = {
      keyFormat,
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 7) + '...',
      apiResponseStatus: response.status,
      timestamp: new Date().toISOString()
    };

    if (!response.ok) {
      const errorData = await response.json();
      
      return NextResponse.json({
        error: 'OpenAI API Error',
        details: errorData,
        debugInfo,
        status: response.status,
        suggestions: getErrorSuggestions(response.status, errorData)
      });
    }

    const data = await response.json();
    
    return NextResponse.json({
      status: 'success',
      message: 'OpenAI API is working correctly',
      debugInfo,
      availableModels: data.data?.slice(0, 5).map((model: any) => model.id) || []
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Network or configuration error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function getErrorSuggestions(status: number, errorData: any) {
  const suggestions = [];

  switch (status) {
    case 401:
      suggestions.push('API key is invalid or expired');
      suggestions.push('Check your OpenAI dashboard for the correct API key');
      suggestions.push('Make sure the key starts with "sk-"');
      break;
      
    case 429:
      const errorMessage = errorData.error?.message || '';
      
      if (errorMessage.includes('quota')) {
        suggestions.push('🚨 QUOTA EXCEEDED: Your OpenAI account has reached its usage limit');
        suggestions.push('💳 Add billing info or upgrade your plan at https://platform.openai.com/account/billing');
        suggestions.push('📊 Check usage at https://platform.openai.com/account/usage');
      } else if (errorMessage.includes('rate')) {
        suggestions.push('⏱️ RATE LIMIT: Too many requests per minute');
        suggestions.push('Wait a moment and try again');
        suggestions.push('Consider upgrading to a higher tier for more requests');
      } else {
        suggestions.push('429 error - could be quota or rate limit');
        suggestions.push('Check your OpenAI dashboard for details');
      }
      break;
      
    case 403:
      suggestions.push('Permission denied - check your API key permissions');
      break;
      
    default:
      suggestions.push(`HTTP ${status} error - check OpenAI status page`);
  }

  return suggestions;
} 
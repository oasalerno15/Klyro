import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis instance
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : undefined;

// Fallback in-memory store for development
const memoryStore = new Map();

// Rate limiters for different endpoints
export const rateLimiters = {
  // Stripe checkout - 5 requests per minute per user
  checkout: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
  }) : null,

  // AI requests - 10 requests per minute per user
  ai: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
  }) : null,

  // General API - 100 requests per minute per user
  api: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
  }) : null,

  // Auth endpoints - 5 requests per minute per IP
  auth: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
  }) : null,
};

// Fallback rate limiting for development (in-memory)
function fallbackRateLimit(key: string, limit: number, windowMs: number): { success: boolean; remaining: number; reset?: Date } {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!memoryStore.has(key)) {
    memoryStore.set(key, []);
  }
  
  const requests = memoryStore.get(key).filter((time: number) => time > windowStart);
  
  if (requests.length >= limit) {
    return { 
      success: false, 
      remaining: 0,
      reset: new Date(now + windowMs)
    };
  }
  
  requests.push(now);
  memoryStore.set(key, requests);
  
  return { 
    success: true, 
    remaining: limit - requests.length - 1,
    reset: new Date(now + windowMs)
  };
}

// Rate limit helper function
export async function checkRateLimit(
  type: keyof typeof rateLimiters,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset?: Date }> {
  const limiter = rateLimiters[type];
  
  if (!limiter) {
    // Fallback for development
    const limits = {
      checkout: { limit: 5, window: 60000 },
      ai: { limit: 10, window: 60000 },
      api: { limit: 100, window: 60000 },
      auth: { limit: 5, window: 60000 },
    };
    
    const config = limits[type];
    return fallbackRateLimit(identifier, config.limit, config.window);
  }
  
  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset ? new Date(result.reset) : undefined,
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Allow request on error
    return { success: true, remaining: 0 };
  }
}

// Middleware helper for Next.js API routes
export function withRateLimit(type: keyof typeof rateLimiters) {
  return async function(request: Request, getIdentifier?: (req: Request) => string) {
    const identifier = getIdentifier ? getIdentifier(request) : 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'anonymous';
    
    const result = await checkRateLimit(type, identifier);
    
    if (!result.success) {
      const retryAfter = result.reset ? Math.ceil((result.reset.getTime() - Date.now()) / 1000) : 60;
      
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          retryAfter
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': result.remaining.toString(),
            'Retry-After': retryAfter.toString(),
          }
        }
      );
    }
    
    return null; // Continue with request
  };
} 
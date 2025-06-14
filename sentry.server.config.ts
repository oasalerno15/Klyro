import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Filter out common noise and add context
  beforeSend(event) {
    // Add additional context for API errors
    if (event.request?.url) {
      event.tags = {
        ...event.tags,
        api_endpoint: event.request.url,
      };
    }
    
    // Filter out expected errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      
      // Don't report rate limiting errors as they're expected
      if (error?.value?.includes('Rate limit exceeded')) {
        return null;
      }
      
      // Don't report auth errors for unauthenticated requests
      if (error?.value?.includes('Authentication required')) {
        return null;
      }
    }
    
    return event;
  },
  
  // Set server context
  initialScope: {
    tags: {
      component: "klyro-backend"
    },
  },
}); 
// Simple in-memory rate limiter
// For production, consider using Redis or a dedicated service

const rateLimitMap = new Map();

export function rateLimit(options = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute
    max = 100, // max requests per window
    keyGenerator = (request) => {
      // Use IP address as default key
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
      return ip;
    },
    message = 'Too many requests, please try again later.',
  } = options;

  return async (request) => {
    const key = keyGenerator(request);
    const now = Date.now();
    
    // Clean up old entries (older than window)
    if (rateLimitMap.size > 10000) {
      // Only clean up if map gets too large
      for (const [k, v] of rateLimitMap.entries()) {
        if (now - v.resetTime > windowMs) {
          rateLimitMap.delete(k);
        }
      }
    }
    
    const record = rateLimitMap.get(key);
    
    if (!record || now > record.resetTime) {
      // Create new record or reset expired one
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return null; // No rate limit exceeded
    }
    
    record.count++;
    
    if (record.count > max) {
      return {
        error: message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      };
    }
    
    return null; // No rate limit exceeded
  };
}

// Pre-configured rate limiters
export const standardRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
});

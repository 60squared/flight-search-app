import rateLimit from 'express-rate-limit';

/**
 * Rate limiter middleware
 * Limits requests to 100 per 15 minutes per IP
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests. Please try again later.',
      },
    });
  },
});

/**
 * Stricter rate limiter for sensitive operations
 * Limits to 20 requests per 15 minutes
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Rate limit exceeded. Please slow down.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

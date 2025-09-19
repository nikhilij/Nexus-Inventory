# Nexus-Inventory Middleware Documentation

## Overview

The Nexus-Inventory application now includes a comprehensive middleware system with advanced features for authentication, validation, rate limiting, caching, error handling, and logging. This professional-grade middleware stack provides enterprise-level security, performance, and reliability.

## Middleware Components

### 1. AuthMiddleware (`middleware/AuthMiddleware.js`)

- **JWT Authentication**: Supports both JWT tokens and API keys
- **Role-Based Access Control**: Hierarchical permission system
- **Organization Context**: Multi-tenant support
- **Session Management**: Automatic session validation and refresh

### 2. ValidationMiddleware (`middleware/ValidationMiddleware.js`)

- **Schema Validation**: Comprehensive input validation
- **Data Sanitization**: XSS and injection protection
- **Model-Based Validation**: Database-aware validation rules
- **Business Rule Enforcement**: Custom validation logic

### 3. RateLimitMiddleware (`middleware/RateLimitMiddleware.js`)

- **Multiple Strategies**: Sliding window, burst, and user-based limiting
- **In-Memory Store**: High-performance rate limiting
- **Administrative Controls**: Dynamic rate limit management
- **Analytics**: Rate limit monitoring and reporting

### 4. CacheMiddleware (`middleware/CacheMiddleware.js`)

- **Multi-Level Caching**: LRU, LFU, and TTL strategies
- **Cache Warming**: Proactive cache population
- **Conditional Caching**: Smart cache invalidation
- **Performance Monitoring**: Cache hit/miss analytics

### 5. ErrorHandlingMiddleware (`middleware/ErrorHandlingMiddleware.js`)

- **Circuit Breaker Pattern**: Automatic failure detection and recovery
- **Graceful Degradation**: Maintain service availability during failures
- **Retry Logic**: Intelligent retry mechanisms
- **Error Classification**: Structured error handling and reporting

### 6. LoggingMiddleware (`middleware/LoggingMiddleware.js`)

- **Structured Logging**: JSON-formatted logs with consistent schema
- **Performance Monitoring**: Response time tracking and slow request detection
- **Security Auditing**: Comprehensive security event logging
- **Analytics**: Request/response analytics and error tracking

### 7. MiddlewareComposer (`middleware/MiddlewareComposer.js`)

- **Middleware Composition**: Combine multiple middleware components
- **Pre-configured Stacks**: Ready-to-use middleware combinations
- **Conditional Application**: Dynamic middleware selection
- **Pipeline Management**: Ordered middleware execution

## Quick Start

### Basic Usage

```javascript
import { middlewareStacks } from "../middleware/index.js";

// Apply to an API route
export const middleware = middlewareStacks.protected;

// Or use specific middleware
import { authMiddleware, validationMiddleware } from "../middleware/index.js";

export const middleware = [
   authMiddleware.authenticate(),
   validationMiddleware.validateBody(),
   // ... other middleware
];
```

### Environment Configuration

The middleware automatically configures itself based on `NODE_ENV`:

- **Development**: Debug logging, detailed errors, no caching
- **Production**: Info logging, secure errors, full caching
- **Test**: Error-only logging, no caching, detailed errors

## Usage Examples

### 1. API Route Protection

```javascript
// app/api/users/route.js
import { middlewareStacks } from "../../../middleware/index.js";

export const GET = middlewareStacks.user; // Authenticated user access
export const POST = middlewareStacks.admin; // Admin-only access
export const PUT = middlewareStacks.user;
export const DELETE = middlewareStacks.admin;
```

### 2. Custom Middleware Stack

```javascript
import { middlewareComposer } from "../../../middleware/index.js";

const customMiddleware = middlewareComposer.customMiddleware(["logging", "rateLimit", "auth", "validation", "cache"], {
   logging: { level: "debug", includeBody: true },
   rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
   auth: true,
   validation: {
      schema: {
         name: { type: "string", required: true },
         email: { type: "string", required: true, format: "email" },
      },
   },
   cache: { ttl: 300 },
});
```

### 3. Conditional Middleware

```javascript
import { conditionalMiddleware, middlewareStacks } from "../../../middleware/index.js";

export const middleware = conditionalMiddleware(
   (req) => req.headers["x-api-key"], // Condition
   middlewareStacks.secure, // If condition met
   middlewareStacks.public // Fallback
);
```

### 4. File Upload with Validation

```javascript
// app/api/upload/route.js
import { middlewareStacks } from "../../../middleware/index.js";

export const POST = middlewareStacks.upload; // Includes file size validation
```

## Pre-configured Stacks

### Public Stack

- Rate limiting (1000 requests/15min)
- Request/Response logging
- Error handling

### Protected Stack

- Authentication required
- Input validation
- Rate limiting (100 requests/15min)
- Caching (5 minutes TTL)
- Request/Response logging
- Error handling

### Admin Stack

- Admin role required
- Rate limiting (50 requests/15min)
- Audit logging
- Request/Response logging
- Error handling

### User Stack

- User authentication required
- Rate limiting (200 requests/15min)
- Caching (10 minutes TTL)
- Request/Response logging
- Error handling

### Upload Stack

- Authentication required
- File size validation (10MB limit)
- Rate limiting (10 uploads/hour)
- Request/Response logging
- Error handling

### Search Stack

- Authentication required
- Rate limiting (30 searches/minute)
- Caching (1 minute TTL)
- Request/Response logging
- Error handling

### Secure Stack

- Admin/Manager roles required
- Strict rate limiting (25 requests/15min)
- Audit logging
- Full request logging
- Input validation
- Error handling

## Advanced Features

### Circuit Breaker Pattern

Automatically detects and recovers from service failures:

```javascript
// Automatic failure detection
if (errorCount > threshold) {
   circuitBreaker.open();
   // Graceful degradation
}
```

### Multi-Level Caching

Combines multiple caching strategies for optimal performance:

```javascript
// LRU for frequently accessed data
// LFU for popular but less recent data
// TTL for time-sensitive data
```

### Security Auditing

Comprehensive security event logging:

```javascript
// Logs authentication attempts
// Tracks permission checks
// Detects suspicious activity
// Audits sensitive operations
```

### Performance Monitoring

Real-time performance tracking:

```javascript
// Response time monitoring
// Slow request detection
// Memory usage tracking
// Cache hit/miss ratios
```

## Configuration

### Environment Variables

```bash
NODE_ENV=production          # Environment (development/production/test)
LOG_LEVEL=info              # Logging level
CACHE_ENABLED=true          # Enable/disable caching
RATE_LIMIT_STRICT=true      # Strict rate limiting
ERROR_STACK_TRACE=false     # Include stack traces in errors
```

### Custom Configuration

```javascript
import { middlewareComposer } from "../middleware/index.js";

// Add custom middleware
middlewareComposer.addMiddleware("customAuth", customAuthMiddleware);

// Create custom pipeline
const customPipeline = middlewareComposer.createPipeline("api", {
   auth: true,
   validation: true,
   rateLimit: { windowMs: 10 * 60 * 1000, max: 500 },
   cache: { ttl: 600 },
   logging: true,
   error: true,
});
```

## Error Handling

### Structured Error Responses

```json
{
   "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid input data",
      "details": {
         "field": "email",
         "reason": "Invalid email format"
      },
      "requestId": "req_1234567890_1234567890"
   }
}
```

### Circuit Breaker States

- **Closed**: Normal operation
- **Open**: Service failure detected, fast-fail responses
- **Half-Open**: Testing service recovery

## Monitoring and Analytics

### Request Analytics

```javascript
// Get request statistics
const stats = loggingMiddleware.getRequestStats(3600000); // Last hour
console.log(`Total requests: ${stats.totalRequests}`);
console.log(`Average response time: ${stats.averageResponseTime}ms`);
console.log(`Error rate: ${stats.errorRate}%`);
```

### Error Analytics

```javascript
// Get error statistics
const errorStats = loggingMiddleware.getErrorStats(3600000);
console.log(`Total errors: ${errorStats.totalErrors}`);
console.log(`Error rate: ${errorStats.errorRate}%`);
console.log(`Top errors:`, errorStats.topErrors);
```

### Performance Analytics

```javascript
// Get performance statistics
const perfStats = loggingMiddleware.getPerformanceStats(3600000);
console.log(`Average response time: ${perfStats.averageResponseTime}ms`);
console.log(`95th percentile: ${perfStats.percentile95}ms`);
console.log(`99th percentile: ${perfStats.percentile99}ms`);
```

## Best Practices

### 1. Security

- Always use HTTPS in production
- Implement proper CORS policies
- Regularly rotate API keys and JWT secrets
- Monitor for suspicious activity patterns

### 2. Performance

- Enable caching for read-heavy endpoints
- Use appropriate rate limiting for different user types
- Monitor response times and optimize slow endpoints
- Implement proper database indexing

### 3. Reliability

- Use circuit breakers for external service calls
- Implement proper retry logic with exponential backoff
- Monitor error rates and set up alerts
- Have fallback mechanisms for critical services

### 4. Monitoring

- Log all authentication attempts
- Monitor rate limit hits
- Track performance metrics
- Set up alerts for anomalies

## Troubleshooting

### Common Issues

1. **Rate Limiting Too Aggressive**

   ```javascript
   // Adjust rate limits
   const customLimits = middlewareComposer.customMiddleware(["rateLimit"], {
      rateLimit: { windowMs: 30 * 60 * 1000, max: 500 },
   });
   ```

2. **Caching Issues**

   ```javascript
   // Disable caching for debugging
   process.env.CACHE_ENABLED = "false";
   ```

3. **Authentication Problems**

   ```javascript
   // Check JWT token validity
   const token = req.headers.authorization?.split(" ")[1];
   // Verify token format and expiration
   ```

4. **Validation Errors**
   ```javascript
   // Enable detailed validation errors in development
   process.env.NODE_ENV = "development";
   ```

## Migration Guide

### From Basic Middleware

If you have existing basic middleware, migrate gradually:

1. Replace basic auth with `AuthMiddleware`
2. Add `ValidationMiddleware` for input validation
3. Implement `RateLimitMiddleware` for protection
4. Add `CacheMiddleware` for performance
5. Use `ErrorHandlingMiddleware` for reliability
6. Implement `LoggingMiddleware` for monitoring

### Example Migration

```javascript
// Before
const auth = (req, res, next) => {
   /* basic auth */
};
const validate = (req, res, next) => {
   /* basic validation */
};

// After
import { middlewareStacks } from "../middleware/index.js";
export const middleware = middlewareStacks.protected;
```

## Support

For issues or questions about the middleware system:

1. Check the logs for detailed error information
2. Review the middleware configuration
3. Test with different environments (dev/prod/test)
4. Monitor performance metrics
5. Check circuit breaker status

The middleware system is designed to be robust, secure, and performant while providing comprehensive monitoring and error handling capabilities.

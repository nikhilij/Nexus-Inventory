// middleware/SecurityHeadersMiddleware.js
import helmet from "helmet";

class SecurityHeadersMiddleware {
   constructor(options = {}) {
      this.helmetOptions = {
         contentSecurityPolicy: {
            directives: {
               defaultSrc: ["'self'"],
               scriptSrc: ["'self'", "'unsafe-inline'"],
               styleSrc: ["'self'", "'unsafe-inline'"],
               imgSrc: ["'self'", "data:"],
               connectSrc: ["'self'"],
               fontSrc: ["'self'"],
               objectSrc: ["'none'"],
               upgradeInsecureRequests: [],
               ...options.contentSecurityPolicy?.directives,
            },
         },
         strictTransportSecurity: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
            ...options.strictTransportSecurity,
         },
         xFrameOptions: {
            action: "deny",
            ...options.xFrameOptions,
         },
         ...options,
      };
   }

   // Middleware to apply all security headers
   apply() {
      return helmet(this.helmetOptions);
   }

   // Middleware for Content Security Policy (CSP)
   csp() {
      return helmet.contentSecurityPolicy(this.helmetOptions.contentSecurityPolicy);
   }

   // Middleware for HTTP Strict Transport Security (HSTS)
   hsts() {
      return helmet.strictTransportSecurity(this.helmetOptions.strictTransportSecurity);
   }

   // Middleware for X-Frame-Options
   frameguard() {
      return helmet.frameguard(this.helmetOptions.xFrameOptions);
   }

   // Middleware for X-Content-Type-Options
   noSniff() {
      return helmet.noSniff();
   }

   // Middleware for X-XSS-Protection
   xssFilter() {
      return helmet.xssFilter();
   }

   // Middleware for Referrer-Policy
   referrerPolicy(options = { policy: "no-referrer" }) {
      return helmet.referrerPolicy(options);
   }

   // Update CSP directives dynamically
   updateCsp(newDirectives) {
      this.helmetOptions.contentSecurityPolicy.directives = {
         ...this.helmetOptions.contentSecurityPolicy.directives,
         ...newDirectives,
      };
   }
}

const securityHeadersMiddleware = new SecurityHeadersMiddleware({
   contentSecurityPolicy: {
      directives: {
         defaultSrc: ["'self'", "api.example.com"],
         scriptSrc: ["'self'", "cdn.example.com"],
         styleSrc: ["'self'", "fonts.googleapis.com"],
         fontSrc: ["'self'", "fonts.gstatic.com"],
      },
   },
   strictTransportSecurity: {
      maxAge: 63072000, // 2 years
   },
});

export default securityHeadersMiddleware;

// Export individual middleware functions
export const applySecurityHeaders = securityHeadersMiddleware.apply.bind(securityHeadersMiddleware);
export const csp = securityHeadersMiddleware.csp.bind(securityHeadersMiddleware);
export const hsts = securityHeadersMiddleware.hsts.bind(securityHeadersMiddleware);
export const frameguard = securityHeadersMiddleware.frameguard.bind(securityHeadersMiddleware);
export const noSniff = securityHeadersMiddleware.noSniff.bind(securityHeadersMiddleware);
export const xssFilter = securityHeadersMiddleware.xssFilter.bind(securityHeadersMiddleware);
export const referrerPolicy = securityHeadersMiddleware.referrerPolicy.bind(securityHeadersMiddleware);

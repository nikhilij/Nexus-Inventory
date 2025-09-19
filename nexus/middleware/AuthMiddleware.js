// middleware/AuthMiddleware.js
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { User, Session, ApiKey, Organization } from "../models/index.js";
import { modelRegistry } from "../models/index.js";

class AuthMiddleware {
   constructor() {
      this.jwtSecret = process.env.JWT_SECRET || "your-super-secret-jwt-key";
      this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key";
      this.sessionMaxAge = 24 * 60 * 60 * 1000; // 24 hours
   }

   // Main authentication middleware for API routes
   async authenticate(req, res, next) {
      try {
         const authHeader = req.headers.authorization;
         const token = this.extractTokenFromHeader(authHeader);

         if (!token) {
            return this.handleUnauthenticated(res, "No authentication token provided");
         }

         // Try JWT token first
         const jwtPayload = await this.verifyJWTToken(token);
         if (jwtPayload) {
            req.user = jwtPayload.user;
            req.organization = jwtPayload.organization;
            req.authType = "jwt";
            return next();
         }

         // Try API key authentication
         const apiKeyPayload = await this.verifyApiKey(token);
         if (apiKeyPayload) {
            req.user = apiKeyPayload.user;
            req.organization = apiKeyPayload.organization;
            req.apiKey = apiKeyPayload.apiKey;
            req.authType = "api_key";
            return next();
         }

         return this.handleUnauthenticated(res, "Invalid authentication token");
      } catch (error) {
         console.error("Authentication error:", error);
         return this.handleAuthError(res, error);
      }
   }

   // Session-based authentication for pages
   async authenticateSession(req, res, next) {
      try {
         const session = await getServerSession(req, res, {
            // NextAuth configuration would go here
         });

         if (!session) {
            return this.handleUnauthenticated(res, "No active session");
         }

         // Get user from database
         const user = await User.findById(session.user.id).populate("organization").populate("role");

         if (!user) {
            return this.handleUnauthenticated(res, "User not found");
         }

         req.user = user;
         req.session = session;
         req.authType = "session";

         next();
      } catch (error) {
         console.error("Session authentication error:", error);
         return this.handleAuthError(res, error);
      }
   }

   // Multi-tenant organization context middleware
   async setOrganizationContext(req, res, next) {
      try {
         if (!req.user) {
            return next();
         }

         let organizationId = req.user.organization;

         // Check for organization override in headers
         const orgHeader = req.headers["x-organization-id"];
         if (orgHeader && req.user.role?.name === "super_admin") {
            organizationId = orgHeader;
         }

         if (organizationId) {
            const organization = await Organization.findById(organizationId);
            if (organization) {
               req.organization = organization;
               req.organizationId = organizationId;
            }
         }

         next();
      } catch (error) {
         console.error("Organization context error:", error);
         return this.handleAuthError(res, error);
      }
   }

   // Role-based authorization middleware
   authorize(roles = []) {
      return async (req, res, next) => {
         try {
            if (!req.user) {
               return this.handleUnauthenticated(res, "Authentication required");
            }

            // Super admin bypass
            if (req.user.role?.name === "super_admin") {
               return next();
            }

            // Check if user has required role
            const userRole = req.user.role?.name;
            if (!userRole || !roles.includes(userRole)) {
               return this.handleUnauthorized(res, "Insufficient permissions");
            }

            next();
         } catch (error) {
            console.error("Authorization error:", error);
            return this.handleAuthError(res, error);
         }
      };
   }

   // Permission-based authorization middleware
   authorizePermission(permission) {
      return async (req, res, next) => {
         try {
            if (!req.user) {
               return this.handleUnauthenticated(res, "Authentication required");
            }

            // Super admin bypass
            if (req.user.role?.name === "super_admin") {
               return next();
            }

            // Check if user has the required permission
            const hasPermission = await this.checkUserPermission(req.user._id, permission);
            if (!hasPermission) {
               return this.handleUnauthorized(res, `Permission '${permission}' required`);
            }

            next();
         } catch (error) {
            console.error("Permission authorization error:", error);
            return this.handleAuthError(res, error);
         }
      };
   }

   // Resource ownership middleware
   authorizeResourceOwnership(resourceType, resourceIdParam = "id") {
      return async (req, res, next) => {
         try {
            if (!req.user) {
               return this.handleUnauthenticated(res, "Authentication required");
            }

            const resourceId = req.params[resourceIdParam];
            if (!resourceId) {
               return res.status(400).json({ error: "Resource ID required" });
            }

            // Check resource ownership
            const isOwner = await this.checkResourceOwnership(
               req.user._id,
               resourceType,
               resourceId,
               req.organizationId
            );

            if (!isOwner) {
               return this.handleUnauthorized(res, "Resource access denied");
            }

            next();
         } catch (error) {
            console.error("Resource ownership error:", error);
            return this.handleAuthError(res, error);
         }
      };
   }

   // API key rate limiting and validation
   async validateApiKey(req, res, next) {
      try {
         if (req.authType !== "api_key") {
            return next();
         }

         const apiKey = req.apiKey;

         // Check if API key is active
         if (!apiKey.isActive) {
            return res.status(401).json({ error: "API key is inactive" });
         }

         // Check expiration
         if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
            return res.status(401).json({ error: "API key has expired" });
         }

         // Update last used timestamp
         await ApiKey.findByIdAndUpdate(apiKey._id, {
            lastUsedAt: new Date(),
            $inc: { usageCount: 1 },
         });

         // Check rate limits
         const rateLimitExceeded = await this.checkRateLimit(apiKey);
         if (rateLimitExceeded) {
            return res.status(429).json({
               error: "Rate limit exceeded",
               retryAfter: apiKey.rateLimit?.windowMs || 60000,
            });
         }

         next();
      } catch (error) {
         console.error("API key validation error:", error);
         return this.handleAuthError(res, error);
      }
   }

   // JWT token generation
   generateAccessToken(user, organization = null) {
      const payload = {
         user: {
            id: user._id,
            email: user.email,
            role: user.role?.name,
         },
         organization: organization
            ? {
                 id: organization._id,
                 name: organization.name,
              }
            : null,
         type: "access",
         iat: Math.floor(Date.now() / 1000),
         exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
      };

      return jwt.sign(payload, this.jwtSecret);
   }

   // JWT refresh token generation
   generateRefreshToken(user) {
      const payload = {
         userId: user._id,
         type: "refresh",
         iat: Math.floor(Date.now() / 1000),
         exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      };

      return jwt.sign(payload, this.jwtRefreshSecret);
   }

   // JWT token refresh
   async refreshAccessToken(refreshToken) {
      try {
         const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret);

         if (decoded.type !== "refresh") {
            throw new Error("Invalid token type");
         }

         const user = await User.findById(decoded.userId).populate("role").populate("organization");

         if (!user) {
            throw new Error("User not found");
         }

         return {
            accessToken: this.generateAccessToken(user, user.organization),
            refreshToken: this.generateRefreshToken(user),
            user: user,
         };
      } catch (error) {
         throw new Error("Invalid refresh token");
      }
   }

   // Helper methods
   extractTokenFromHeader(authHeader) {
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
         return null;
      }
      return authHeader.substring(7);
   }

   async verifyJWTToken(token) {
      try {
         const decoded = jwt.verify(token, this.jwtSecret);

         if (decoded.type !== "access") {
            return null;
         }

         const user = await User.findById(decoded.user.id).populate("role").populate("organization");

         if (!user) {
            return null;
         }

         return {
            user,
            organization: decoded.organization,
         };
      } catch (error) {
         return null;
      }
   }

   async verifyApiKey(token) {
      try {
         const apiKey = await ApiKey.findOne({
            key: token,
            isActive: true,
         }).populate({
            path: "createdBy",
            populate: ["role", "organization"],
         });

         if (!apiKey) {
            return null;
         }

         return {
            user: apiKey.createdBy,
            organization: apiKey.createdBy.organization,
            apiKey,
         };
      } catch (error) {
         return null;
      }
   }

   async checkUserPermission(userId, permission) {
      try {
         const user = await User.findById(userId).populate({
            path: "role",
            populate: "permissions",
         });

         if (!user || !user.role) {
            return false;
         }

         return user.role.permissions.some((p) => p.name === permission || p.resource === permission);
      } catch (error) {
         console.error("Permission check error:", error);
         return false;
      }
   }

   async checkResourceOwnership(userId, resourceType, resourceId, organizationId) {
      try {
         const Model = modelRegistry.getModel(resourceType);
         if (!Model) {
            return false;
         }

         const resource = await Model.findById(resourceId);

         if (!resource) {
            return false;
         }

         // Check direct ownership
         if (resource.createdBy && resource.createdBy.toString() === userId.toString()) {
            return true;
         }

         // Check organization ownership
         if (resource.organization && resource.organization.toString() === organizationId) {
            return true;
         }

         // Check team membership for team resources
         if (resourceType === "Team" && resource.members) {
            return resource.members.some((member) => member.toString() === userId.toString());
         }

         return false;
      } catch (error) {
         console.error("Resource ownership check error:", error);
         return false;
      }
   }

   async checkRateLimit(apiKey) {
      try {
         if (!apiKey.rateLimit) {
            return false;
         }

         const { requests, windowMs } = apiKey.rateLimit;
         const windowStart = new Date(Date.now() - windowMs);

         // Count requests in current window
         const recentRequests = await ApiKey.findOne({
            _id: apiKey._id,
            "rateLimitHistory.timestamp": { $gte: windowStart },
         });

         const requestCount = recentRequests?.rateLimitHistory?.length || 0;

         if (requestCount >= requests) {
            return true;
         }

         // Add current request to history
         await ApiKey.findByIdAndUpdate(apiKey._id, {
            $push: {
               rateLimitHistory: {
                  timestamp: new Date(),
                  ip: null, // Would be set by rate limiting middleware
               },
            },
         });

         return false;
      } catch (error) {
         console.error("Rate limit check error:", error);
         return false;
      }
   }

   // Error handlers
   handleUnauthenticated(res, message = "Authentication required") {
      return res.status(401).json({
         error: message,
         code: "AUTHENTICATION_REQUIRED",
      });
   }

   handleUnauthorized(res, message = "Access denied") {
      return res.status(403).json({
         error: message,
         code: "ACCESS_DENIED",
      });
   }

   handleAuthError(res, error) {
      console.error("Authentication middleware error:", error);
      return res.status(500).json({
         error: "Authentication service error",
         code: "AUTH_SERVICE_ERROR",
      });
   }

   // Middleware composition helpers
   combine(...middlewares) {
      return async (req, res, next) => {
         for (const middleware of middlewares) {
            await new Promise((resolve, reject) => {
               middleware(req, res, (err) => {
                  if (err) reject(err);
                  else resolve();
               });
            });
         }
         next();
      };
   }

   // Conditional middleware
   conditional(condition, middleware) {
      return (req, res, next) => {
         if (condition(req)) {
            return middleware(req, res, next);
         }
         next();
      };
   }
}

const authMiddleware = new AuthMiddleware();

export default authMiddleware;

// Export individual middleware functions for Next.js API routes
export const authenticate = authMiddleware.authenticate.bind(authMiddleware);
export const authenticateSession = authMiddleware.authenticateSession.bind(authMiddleware);
export const setOrganizationContext = authMiddleware.setOrganizationContext.bind(authMiddleware);
export const authorize = authMiddleware.authorize.bind(authMiddleware);
export const authorizePermission = authMiddleware.authorizePermission.bind(authMiddleware);
export const authorizeResourceOwnership = authMiddleware.authorizeResourceOwnership.bind(authMiddleware);
export const validateApiKey = authMiddleware.validateApiKey.bind(authMiddleware);

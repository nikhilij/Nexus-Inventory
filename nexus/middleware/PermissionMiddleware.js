// middleware/PermissionMiddleware.js
import { User, Role } from "../models/index.js";
import errorHandlingMiddleware from "./ErrorHandlingMiddleware.js";

class PermissionMiddleware {
   constructor(options = {}) {
      this.logErrors = options.logErrors !== false;
      this.detailedErrors = options.detailedErrors || process.env.NODE_ENV === "development";
   }

   // Middleware to check if user has required roles
   hasRole(requiredRoles) {
      return async (req, res, next) => {
         try {
            if (!req.user) {
               return this.handleError(res, 401, "Authentication required");
            }

            const user = await User.findById(req.user._id).populate("role");
            if (!user || !user.role) {
               return this.handleError(res, 403, "Access denied. No role assigned.");
            }

            const userRoles = Array.isArray(user.role) ? user.role.map((r) => r.name) : [user.role.name];

            const hasPermission = requiredRoles.some((role) => userRoles.includes(role));

            if (!hasPermission) {
               return this.handleError(res, 403, "Access denied. Insufficient permissions.");
            }

            next();
         } catch (error) {
            if (this.logErrors) {
               console.error("Permission check failed:", error);
            }
            return this.handleError(res, 500, "Error during permission check");
         }
      };
   }

   // Middleware to check if user has specific permissions
   hasPermission(requiredPermissions) {
      return async (req, res, next) => {
         try {
            if (!req.user) {
               return this.handleError(res, 401, "Authentication required");
            }

            const user = await User.findById(req.user._id).populate({
               path: "role",
               populate: { path: "permissions" },
            });

            if (!user || !user.role) {
               return this.handleError(res, 403, "Access denied. No role assigned.");
            }

            const userPermissions = this.getUserPermissions(user);
            const hasPermission = requiredPermissions.every((p) => userPermissions.has(p));

            if (!hasPermission) {
               return this.handleError(res, 403, "Access denied. Insufficient permissions.");
            }

            next();
         } catch (error) {
            if (this.logErrors) {
               console.error("Permission check failed:", error);
            }
            return this.handleError(res, 500, "Error during permission check");
         }
      };
   }

   // Middleware to check ownership of a resource
   isOwner(modelName, idParam = "id") {
      return async (req, res, next) => {
         try {
            if (!req.user) {
               return this.handleError(res, 401, "Authentication required");
            }

            const resourceId = req.params[idParam];
            const model = require("../models/index.js")[modelName];

            if (!model) {
               return this.handleError(res, 500, "Invalid model for ownership check");
            }

            const resource = await model.findById(resourceId);

            if (!resource) {
               return this.handleError(res, 404, "Resource not found");
            }

            // Check for ownership (assuming a 'user' or 'createdBy' field)
            const ownerId = resource.user || resource.createdBy;
            if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
               return this.handleError(res, 403, "Access denied. You are not the owner.");
            }

            next();
         } catch (error) {
            if (this.logErrors) {
               console.error("Ownership check failed:", error);
            }
            return this.handleError(res, 500, "Error during ownership check");
         }
      };
   }

   // Combined middleware for role or ownership
   hasRoleOrIsOwner(roles, modelName, idParam = "id") {
      return async (req, res, next) => {
         try {
            if (!req.user) {
               return this.handleError(res, 401, "Authentication required");
            }

            // Check for role first
            const user = await User.findById(req.user._id).populate("role");
            const userRoles = Array.isArray(user.role) ? user.role.map((r) => r.name) : [user.role.name];

            if (roles.some((role) => userRoles.includes(role))) {
               return next();
            }

            // If role check fails, check for ownership
            const resourceId = req.params[idParam];
            const model = require("../models/index.js")[modelName];
            const resource = await model.findById(resourceId);

            if (
               resource &&
               (resource.user?.toString() === req.user._id.toString() ||
                  resource.createdBy?.toString() === req.user._id.toString())
            ) {
               return next();
            }

            return this.handleError(res, 403, "Access denied. Insufficient permissions or ownership.");
         } catch (error) {
            if (this.logErrors) {
               console.error("Role/Ownership check failed:", error);
            }
            return this.handleError(res, 500, "Error during permission check");
         }
      };
   }

   // Helper to get all permissions for a user
   getUserPermissions(user) {
      const permissions = new Set();
      const roles = Array.isArray(user.role) ? user.role : [user.role];

      for (const role of roles) {
         if (role && role.permissions) {
            for (const permission of role.permissions) {
               permissions.add(permission.name);
            }
         }
      }
      return permissions;
   }

   // Centralized error handler
   handleError(res, statusCode, message) {
      const errorResponse = {
         error: {
            code: this.getErrorCode(statusCode),
            message,
         },
      };

      if (this.detailedErrors) {
         errorResponse.error.details = `Permission check failed at ${new Date().toISOString()}`;
      }

      return res.status(statusCode).json(errorResponse);
   }

   getErrorCode(statusCode) {
      switch (statusCode) {
         case 401:
            return "UNAUTHENTICATED";
         case 403:
            return "PERMISSION_DENIED";
         case 404:
            return "NOT_FOUND";
         case 500:
            return "INTERNAL_SERVER_ERROR";
         default:
            return "UNKNOWN_ERROR";
      }
   }

   // Dynamic permission check based on route and method
   check(routeConfig) {
      return (req, res, next) => {
         const { method, path } = req;
         const requiredPermission = routeConfig[path]?.[method];

         if (!requiredPermission) {
            return next(); // No permission defined for this route
         }

         return this.hasPermission([requiredPermission])(req, res, next);
      };
   }
}

const permissionMiddleware = new PermissionMiddleware();

export default permissionMiddleware;

// Export individual middleware functions
export const hasRole = permissionMiddleware.hasRole.bind(permissionMiddleware);
export const hasPermission = permissionMiddleware.hasPermission.bind(permissionMiddleware);
export const isOwner = permissionMiddleware.isOwner.bind(permissionMiddleware);
export const hasRoleOrIsOwner = permissionMiddleware.hasRoleOrIsOwner.bind(permissionMiddleware);
export const checkPermission = permissionMiddleware.check.bind(permissionMiddleware);

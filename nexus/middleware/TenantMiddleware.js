// middleware/TenantMiddleware.js
import { Organization } from "../models/index.js";

class TenantMiddleware {
   constructor(options = {}) {
      this.logErrors = options.logErrors !== false;
      this.headerName = options.headerName || "X-Tenant-ID";
      this.queryParamName = options.queryParamName || "tenantId";
      this.defaultTenant = options.defaultTenant || null;
   }

   // Middleware to identify and set the tenant context
   identify() {
      return async (req, res, next) => {
         try {
            const tenantId = this.resolveTenantId(req);

            if (!tenantId) {
               if (this.defaultTenant) {
                  req.tenant = { id: this.defaultTenant };
                  return next();
               }
               return this.handleError(res, 400, "Tenant ID is required");
            }

            const tenant = await Organization.findById(tenantId);

            if (!tenant) {
               return this.handleError(res, 404, "Tenant not found");
            }

            req.tenant = tenant;
            next();
         } catch (error) {
            if (this.logErrors) {
               console.error("Tenant identification failed:", error);
            }
            return this.handleError(res, 500, "Error identifying tenant");
         }
      };
   }

   // Resolve tenant ID from header, query parameter, or user session
   resolveTenantId(req) {
      // 1. Header
      const headerTenantId = req.headers[this.headerName.toLowerCase()];
      if (headerTenantId) return headerTenantId;

      // 2. Query parameter
      const queryTenantId = req.query[this.queryParamName];
      if (queryTenantId) return queryTenantId;

      // 3. User's default organization (if authenticated)
      if (req.user && req.user.defaultOrganization) {
         return req.user.defaultOrganization;
      }

      return null;
   }

   // Middleware to ensure user belongs to the identified tenant
   ensureMembership() {
      return async (req, res, next) => {
         if (!req.user || !req.tenant) {
            return this.handleError(res, 401, "Authentication and tenant context required");
         }

         // Check if user is part of the tenant's organization
         const isMember = req.user.organizations.some((orgId) => orgId.equals(req.tenant._id));

         if (!isMember) {
            return this.handleError(res, 403, "Access denied. User is not a member of this tenant.");
         }

         next();
      };
   }

   // Combined middleware for identification and membership check
   tenant() {
      return [this.identify(), this.ensureMembership()];
   }

   // Centralized error handler
   handleError(res, statusCode, message) {
      return res.status(statusCode).json({
         error: {
            code: this.getErrorCode(statusCode),
            message,
         },
      });
   }

   getErrorCode(statusCode) {
      switch (statusCode) {
         case 400:
            return "BAD_REQUEST";
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
}

const tenantMiddleware = new TenantMiddleware({
   headerName: "X-Organization-ID",
   queryParamName: "orgId",
});

export default tenantMiddleware;

// Export individual middleware functions
export const identifyTenant = tenantMiddleware.identify.bind(tenantMiddleware);
export const ensureTenantMembership = tenantMiddleware.ensureMembership.bind(tenantMiddleware);
export const tenant = tenantMiddleware.tenant.bind(tenantMiddleware);

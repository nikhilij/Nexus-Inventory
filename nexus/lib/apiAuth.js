// lib/apiAuth.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../app/api/auth/[...nextauth]/options";
import { User } from "../models/index";
import { dbConnect } from "./dbConnect";

/**
 * Get authenticated session for API routes
 * @returns {Promise<Object>} Authentication details with user, isAuthenticated, and isAdmin flags
 */
export async function getAuthServerSession() {
   try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user) {
         return {
            isAuthenticated: false,
            isAdmin: false,
            user: null,
         };
      }

      // Connect to database
      await dbConnect();

      // Fetch complete user details if we have a session
      let userData = null;
      if (session.user.email) {
         userData = await User.findOne({ email: session.user.email }).lean();
      }

      // Check for admin role
      const isAdmin = userData && (userData.role === "admin" || (userData.roles && userData.roles.includes("admin")));

      return {
         isAuthenticated: true,
         isAdmin,
         user: userData || session.user,
      };
   } catch (error) {
      console.error("Error getting authenticated session:", error);
      return {
         isAuthenticated: false,
         isAdmin: false,
         user: null,
      };
   }
}

/**
 * Check if a user has a specific role
 * @param {Object} user - User object
 * @param {String} role - Role to check
 * @returns {Boolean} - Whether user has the role
 */
export function hasRole(user, role) {
   if (!user) return false;
   if (user.role === role) return true;
   return user.roles && Array.isArray(user.roles) && user.roles.includes(role);
}

/**
 * Create API route wrapper that handles authentication and authorization
 * @param {Function} handler - Route handler function
 * @param {Object} options - Options for the wrapper
 * @returns {Function} - Wrapped handler function
 */
export function withAuth(handler, { requireAuth = true, requireAdmin = false, allowedRoles = [] } = {}) {
   return async function (req, ...args) {
      const { isAuthenticated, isAdmin, user } = await getAuthServerSession();

      // Check authentication if required
      if (requireAuth && !isAuthenticated) {
         return Response.json({ error: "Authentication required" }, { status: 401 });
      }

      // Check admin role if required
      if (requireAdmin && !isAdmin) {
         return Response.json({ error: "Admin access required" }, { status: 403 });
      }

      // Check allowed roles if specified
      if (allowedRoles.length > 0 && !allowedRoles.some((role) => hasRole(user, role))) {
         return Response.json(
            {
               error: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
            },
            { status: 403 }
         );
      }

      // Make auth info available to the handler
      req.auth = { isAuthenticated, isAdmin, user };

      // Call the original handler
      return handler(req, ...args);
   };
}

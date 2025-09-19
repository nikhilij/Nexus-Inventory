// lib/apiMiddleware.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { dbConnect } from "./dbConnect";
import { validateData } from "./validation";
import * as models from "../models/index";

// Helper function to wrap API route handlers with common middleware
export function withApiMiddleware(handler, options = {}) {
   const { requireAuth = false, requireAdmin = false, validateModel = null } = options;

   return async function (req, context) {
      try {
         // Ensure database connection
         await dbConnect();

         // Authentication check if required
         if (requireAuth || requireAdmin) {
            const session = await getServerSession();

            if (!session) {
               return NextResponse.json({ error: "Authentication required" }, { status: 401 });
            }

            // Add user to request
            req.user = session.user;
            req.session = session;

            // Admin role check if required
            if (requireAdmin && (!session.user.role || session.user.role !== "admin")) {
               return NextResponse.json({ error: "Admin access required" }, { status: 403 });
            }
         }

         // Input validation if model provided
         if (validateModel && req.method !== "GET") {
            try {
               const body = await req.json().catch(() => ({}));
               req.body = body;

               // Skip validation for empty body
               if (Object.keys(body).length > 0) {
                  const schema = {};
                  // Get model schema
                  let model = null;
                  if (typeof validateModel === "string") {
                     model = models[validateModel];
                  } else {
                     model = validateModel;
                  }

                  if (model && model.schema) {
                     // Get validation rules from model schema
                     const paths = model.schema.paths;
                     for (const [path, schemaType] of Object.entries(paths)) {
                        if (path === "__v" || path === "_id") continue;

                        const fieldSchema = {};
                        const schemaOptions = schemaType.options || {};

                        // Type
                        if (schemaType.instance) {
                           fieldSchema.type = schemaType.instance.toLowerCase();
                        }

                        // Required
                        if (schemaOptions.required) {
                           fieldSchema.required = true;
                        }

                        schema[path] = fieldSchema;
                     }

                     // Validate data against schema
                     const validation = validateData(body, schema);
                     if (!validation.isValid) {
                        return NextResponse.json(
                           {
                              error: "Validation failed",
                              details: validation.errors,
                           },
                           { status: 400 }
                        );
                     }
                  }
               }

               // Make the parsed body available to the handler
               req.validatedData = body;
            } catch (error) {
               return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
            }
         }

         // Call the original handler
         return handler(req, context);
      } catch (error) {
         console.error("API error:", error);
         return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: error.status || 500 });
      }
   };
}

// Pre-composed middleware for common API patterns
export const apiMiddleware = {
   // Public API routes (no auth required)
   public: (handler) => withApiMiddleware(handler),

   // Protected API routes (auth required)
   protected: (handler) => withApiMiddleware(handler, { requireAuth: true }),

   // Admin-only API routes
   admin: (handler) => withApiMiddleware(handler, { requireAuth: true, requireAdmin: true }),

   // With validation schema
   withValidation: (handler, schema) => withApiMiddleware(handler, { validateSchema: schema }),

   // Custom middleware combination
   custom: (handler, options) => withApiMiddleware(handler, options),
};

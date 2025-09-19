// app/api/example/route.js
import { NextResponse } from "next/server";
import middlewareComposer from "../../middleware/MiddlewareComposer.js";

// Example API route with comprehensive middleware integration
export async function GET(request) {
   try {
      // This would normally be handled by middleware, but for demonstration:
      const user = request.user; // Set by auth middleware
      const validatedData = request.validatedData; // Set by validation middleware

      // Example response
      return NextResponse.json({
         message: "API route executed successfully",
         user: user ? { id: user._id, email: user.email } : null,
         timestamp: new Date().toISOString(),
         requestId: request.requestId, // Set by logging middleware
      });
   } catch (error) {
      console.error("API route error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
   }
}

export async function POST(request) {
   try {
      const body = await request.json();

      // Validation would normally be handled by middleware
      if (!body.name || !body.email) {
         return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
      }

      // Example business logic
      const newItem = {
         id: Date.now(),
         name: body.name,
         email: body.email,
         createdAt: new Date().toISOString(),
         createdBy: request.user?._id || "anonymous",
      };

      return NextResponse.json(
         {
            message: "Item created successfully",
            item: newItem,
         },
         { status: 201 }
      );
   } catch (error) {
      console.error("API route error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
   }
}

// Example of how to apply middleware to routes
// This would typically be done in a middleware.js file or route wrapper

/*
import { apiMiddleware } from '../../middleware/MiddlewareComposer.js';

// Apply middleware to all routes in this directory
export const middleware = apiMiddleware({
  auth: true,
  validation: true,
  rateLimit: true,
  cache: { ttl: 300 },
  logging: true,
  error: true
});

// Or apply specific middleware to specific routes
export const GET_middleware = apiMiddleware({
  auth: false, // Public read access
  rateLimit: true,
  cache: { ttl: 300 },
  logging: true,
  error: true
});

export const POST_middleware = apiMiddleware({
  auth: true, // Require authentication for writes
  validation: {
    schema: {
      name: { type: 'string', required: true },
      email: { type: 'string', required: true, format: 'email' }
    }
  },
  rateLimit: true,
  logging: true,
  error: true
});
*/

// lib/middlewareAdapter.js
import { NextResponse } from "next/server";
import { middlewareStacks } from "../middleware/index";
import { getServerSession } from "next-auth/next";
import { dbConnect } from "./dbConnect";

// Helper to adapt middleware designed for Express to Next.js API routes
export function adaptMiddleware(middleware) {
   return async (request, context) => {
      // Ensure database connection is established
      await dbConnect();

      // Create Next.js compatible request/response objects
      const req = {
         ...request,
         headers: Object.fromEntries(request.headers.entries()),
         cookies: Object.fromEntries(request.cookies.entries()),
         query: Object.fromEntries(new URL(request.url).searchParams.entries()),
         body: request.body ? await request.json().catch(() => ({})) : {},
         method: request.method,
         url: request.url,
         nextUrl: request.nextUrl,
      };

      // Add user info from session if available
      try {
         const session = await getServerSession();
         if (session) {
            req.user = session.user;
            req.session = session;
         }
      } catch (error) {
         console.error("Error getting session:", error);
      }

      let nextResponse = null;

      // Create Express-like response
      const res = {
         status: (code) => {
            res.statusCode = code;
            return res;
         },
         json: (data) => {
            nextResponse = NextResponse.json(data, { status: res.statusCode || 200 });
            return nextResponse;
         },
         send: (data) => {
            nextResponse = NextResponse.json(data, { status: res.statusCode || 200 });
            return nextResponse;
         },
         setHeader: (name, value) => {
            res.headers = res.headers || new Headers();
            res.headers.set(name, value);
            return res;
         },
         end: () => {
            nextResponse = new NextResponse(null, {
               status: res.statusCode || 204,
               headers: res.headers,
            });
            return nextResponse;
         },
         redirect: (url) => {
            nextResponse = NextResponse.redirect(new URL(url, request.url));
            return nextResponse;
         },
         cookie: (name, value, options) => {
            const cookies = {};
            cookies[name] = value;
            nextResponse = NextResponse.json(
               {},
               {
                  status: res.statusCode || 200,
                  headers: res.headers,
               }
            );
            nextResponse.cookies.set(name, value, options);
            return nextResponse;
         },
         statusCode: 200,
         headers: new Headers(),
      };

      // Execute middleware chain
      try {
         for (const mw of Array.isArray(middleware) ? middleware : [middleware]) {
            await new Promise((resolve, reject) => {
               mw(req, res, (err) => {
                  if (err) reject(err);
                  else resolve();
               });
            });

            // If middleware set a response, return it
            if (nextResponse) {
               return nextResponse;
            }
         }

         // If middleware completes without response, continue
         return null;
      } catch (error) {
         console.error("Middleware error:", error);
         return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: error.status || 500 });
      }
   };
}

// Pre-composed middleware stacks for common API patterns
export const apiMiddleware = {
   // Public API routes (no auth required)
   public: adaptMiddleware(middlewareStacks.public),

   // Protected API routes (auth required)
   protected: adaptMiddleware(middlewareStacks.protected),

   // Admin-only API routes
   admin: adaptMiddleware(middlewareStacks.admin),

   // User-level API routes
   user: adaptMiddleware(middlewareStacks.user),

   // Upload routes with file validation
   upload: adaptMiddleware(middlewareStacks.upload),

   // Custom middleware stack
   custom: (options) => adaptMiddleware(middlewareStacks.custom(options)),
};

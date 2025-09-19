import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
   function middleware(req) {
      const { pathname } = req.nextUrl;
      const token = req.nextauth.token;

      // Define protected inventory routes
      const protectedRoutes = ["/dashboard", "/inventory", "/products", "/orders", "/warehouse", "/reports"];

      // Check if the current path is a protected route
      const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

      if (isProtectedRoute && token) {
         // Check if PIN has been verified
         // In production, this should be checked server-side with secure cookies
         // For now, we'll check a cookie that should be set by the PIN verification
         const pinVerified = req.cookies.get("pinVerified")?.value;

         if (!pinVerified || pinVerified !== "true") {
            // Redirect to PIN verification
            const verifyPinUrl = new URL("/verify-pin", req.url);
            verifyPinUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(verifyPinUrl);
         }
      }

      return NextResponse.next();
   },
   {
      callbacks: {
         authorized: ({ token }) => !!token,
      },
   }
);

export const config = {
   matcher: [
      "/dashboard/:path*",
      "/inventory/:path*",
      "/products/:path*",
      "/orders/:path*",
      "/warehouse/:path*",
      "/reports/:path*",
   ],
};

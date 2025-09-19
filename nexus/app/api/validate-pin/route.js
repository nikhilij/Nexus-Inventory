import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { userService } from "@/lib/userService";

/**
 * Validate user PIN for additional security step
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - Response with PIN validation result
 */
export async function POST(request) {
   try {
      const { isAuthenticated, user } = await getAuthServerSession();

      // Ensure user is authenticated
      if (!isAuthenticated || !user) {
         return NextResponse.json(
            {
               ok: false,
               error: "Authentication required",
            },
            { status: 401 }
         );
      }

      // Get request body
      const body = await request.json();
      const { pin } = body || {};

      if (!pin || typeof pin !== "string") {
         return NextResponse.json(
            {
               ok: false,
               error: "Missing PIN",
            },
            { status: 400 }
         );
      }

      // Get user from database
      const dbUser = await userService.getUserByEmail(user.email);

      if (!dbUser) {
         return NextResponse.json(
            {
               ok: false,
               error: "User not found",
            },
            { status: 404 }
         );
      }

      // Verify PIN
      const pinResult = await userService.verifyPin(dbUser._id, pin);

      if (pinResult.success) {
         // Create response with success message
         const response = NextResponse.json({
            ok: true,
            message: pinResult.message,
         });

         // Set secure cookie to track PIN verification
         response.cookies.set("pinVerified", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60, // 24 hours
            path: "/",
         });

         // Set verification timestamp
         response.cookies.set("pinVerifiedAt", new Date().toISOString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60, // 24 hours
            path: "/",
         });

         return response;
      }

      // Handle different PIN verification failure scenarios
      if (pinResult.needsSetup) {
         return NextResponse.json(
            {
               ok: false,
               error: "PIN not set up",
               needsSetup: true,
               setupUrl: "/setup-pin",
            },
            { status: 403 }
         );
      }

      return NextResponse.json(
         {
            ok: false,
            error: pinResult.message,
         },
         { status: 401 }
      );
   } catch (e) {
      console.error("PIN validation error:", e);
      return NextResponse.json(
         {
            ok: false,
            error: "Server error",
         },
         { status: 500 }
      );
   }
}

/**
 * Check if the current user's PIN is verified
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - Response with PIN verification status
 */
export async function GET(request) {
   try {
      const pinVerified = request.cookies.get("pinVerified")?.value;
      const pinVerifiedAt = request.cookies.get("pinVerifiedAt")?.value;

      // If PIN is verified, check when it was verified
      if (pinVerified === "true" && pinVerifiedAt) {
         const verifiedTime = new Date(pinVerifiedAt);
         const currentTime = new Date();

         // Check if PIN verification is still valid (within 24 hours)
         const isStillValid = currentTime - verifiedTime < 24 * 60 * 60 * 1000;

         if (isStillValid) {
            return NextResponse.json({
               verified: true,
               verifiedAt: pinVerifiedAt,
            });
         }
      }

      return NextResponse.json({
         verified: false,
         verifiedAt: pinVerifiedAt || null,
      });
   } catch (e) {
      console.error("PIN status check error:", e);
      return NextResponse.json(
         {
            verified: false,
            error: "Unable to check status",
         },
         { status: 500 }
      );
   }
}

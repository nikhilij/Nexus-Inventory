import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { userService } from "@/lib/userService";

/**
 * Set up PIN for the authenticated user
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - Response with PIN setup result
 */
export async function POST(request) {
   try {
      console.log("=== SETUP PIN POST API CALLED ===");

      const { isAuthenticated, user } = await getAuthServerSession();

      console.log("Auth result:", { isAuthenticated, user: user ? { id: user._id, email: user.email } : null });

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

      // Validate PIN format (6 digits)
      if (!/^\d{6}$/.test(pin)) {
         return NextResponse.json(
            {
               ok: false,
               error: "PIN must be exactly 6 digits",
            },
            { status: 400 }
         );
      }

      // Get user from database
      console.log("Looking up user with email:", user.email);
      const dbUser = await userService.getUserByEmail(user.email);
      console.log("DB User found:", dbUser ? { id: dbUser._id, email: dbUser.email, hasPin: !!dbUser.pin } : null);

      if (!dbUser) {
         return NextResponse.json(
            {
               ok: false,
               error: "User not found",
            },
            { status: 404 }
         );
      }

      // Update user's PIN
      const updatedUser = await userService.updateUser(dbUser._id, { pin });

      console.log(
         "Updated user after setting PIN:",
         updatedUser ? { id: updatedUser._id, email: updatedUser.email, pin: updatedUser.pin } : null
      );

      if (!updatedUser) {
         return NextResponse.json(
            {
               ok: false,
               error: "Failed to update PIN",
            },
            { status: 500 }
         );
      }

      return NextResponse.json({
         ok: true,
         message: "PIN set up successfully",
      });
   } catch (e) {
      console.error("PIN setup error:", e);
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
 * Check if user has a PIN set up
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - Response with PIN setup status
 */
export async function GET(request) {
   try {
      console.log("=== SETUP PIN GET API CALLED ===");

      const { isAuthenticated, user } = await getAuthServerSession();

      console.log("Auth result:", { isAuthenticated, user: user ? { id: user._id, email: user.email } : null });

      // Ensure user is authenticated
      if (!isAuthenticated || !user) {
         return NextResponse.json(
            {
               hasPin: false,
               error: "Authentication required",
            },
            { status: 401 }
         );
      }

      // Get user from database
      const dbUser = await userService.getUserByEmail(user.email);

      if (!dbUser) {
         return NextResponse.json(
            {
               hasPin: false,
               error: "User not found",
            },
            { status: 404 }
         );
      }

      return NextResponse.json({
         hasPin: !!dbUser.pin,
      });
   } catch (e) {
      console.error("PIN status check error:", e);
      return NextResponse.json(
         {
            hasPin: false,
            error: "Server error",
         },
         { status: 500 }
      );
   }
}

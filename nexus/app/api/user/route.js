import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { userService } from "@/lib/userService";

/**
 * Get the current user information
 * @returns {Promise<NextResponse>} JSON response with user data
 */
export async function GET() {
   // Get the authenticated session
   const session = await getAuthSession();

   if (!session || !session.user) {
      return NextResponse.json({
         authenticated: false,
         subscribed: false,
         user: null,
      });
   }

   try {
      // Get the full user profile from the database
      const user = await userService.getUserByEmail(session.user.email);

      // If no user found in the database, return basic session user
      if (!user) {
         return NextResponse.json({
            authenticated: true,
            subscribed: false,
            user: session.user,
         });
      }

      return NextResponse.json({
         authenticated: true,
         subscribed: !!user.subscription,
         user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            subscription: user.subscription,
         },
      });
   } catch (error) {
      console.error("Error fetching user:", error);

      // Return basic session user on error
      return NextResponse.json({
         authenticated: true,
         subscribed: false,
         user: session.user,
      });
   }
}

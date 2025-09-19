import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";

/**
 * Test API endpoint to debug authentication
 */
export async function GET(request) {
   try {
      console.log("=== AUTH DEBUG API CALLED ===");

      const { isAuthenticated, user } = await getAuthServerSession();

      console.log("Auth result:", { isAuthenticated, user: user ? { id: user._id, email: user.email } : null });

      return NextResponse.json({
         isAuthenticated,
         user: user
            ? {
                 id: user._id,
                 email: user.email,
                 name: user.name,
                 hasPin: !!user.pin,
              }
            : null,
         debug: "Auth test successful",
      });
   } catch (error) {
      console.error("Auth debug error:", error);
      return NextResponse.json(
         {
            error: "Auth debug failed",
            message: error.message,
            stack: error.stack,
         },
         { status: 500 }
      );
   }
}

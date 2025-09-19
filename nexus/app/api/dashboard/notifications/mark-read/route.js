// app/api/dashboard/notifications/mark-read/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { notificationService } from "@/lib/notificationService";

/**
 * Mark notifications as read
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with success status
 */
export async function POST(request) {
   try {
      // Verify authentication
      const { isAuthenticated, user } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const userId = user.id || user._id;

      // Get request body
      const body = await request.json().catch(() => ({}));

      // Get notification IDs from request (optional, if not provided, mark all as read)
      const notificationIds = body.ids || [];

      // Mark notifications as read
      const count = await notificationService.markAsRead(userId, notificationIds);

      return NextResponse.json({
         message: `Marked ${count} notifications as read`,
      });
   } catch (error) {
      console.error("Error marking notifications as read:", error);
      return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
   }
}

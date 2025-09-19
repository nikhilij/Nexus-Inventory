// app/api/dashboard/notifications/delete/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { notificationService } from "@/lib/notificationService";

/**
 * Delete notifications
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

      // Get notification IDs from request (required)
      const notificationIds = body.ids || [];

      if (!notificationIds.length) {
         return NextResponse.json({ error: "No notification IDs provided" }, { status: 400 });
      }

      // Delete notifications
      const count = await notificationService.deleteNotifications(userId, notificationIds);

      return NextResponse.json({
         message: `Deleted ${count} notifications`,
      });
   } catch (error) {
      console.error("Error deleting notifications:", error);
      return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 });
   }
}

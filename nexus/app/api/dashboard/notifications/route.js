// app/api/dashboard/notifications/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { notificationService } from "@/lib/notificationService";

/**
 * Get notifications for the current user
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with notifications
 */
export async function GET(request) {
   try {
      // Verify authentication
      const { isAuthenticated, user } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const userId = user.id || user._id;

      // Parse query parameters
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "10");
      const unreadOnly = url.searchParams.get("unread") === "true";

      // Get notifications
      const { notifications, pagination } = await notificationService.getUserNotifications({
         userId,
         page,
         limit,
         unreadOnly,
      });

      return NextResponse.json({
         data: notifications,
         meta: pagination,
      });
   } catch (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
   }
}

/**
 * Create a notification (admin/system only)
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with created notification
 */
export async function POST(request) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only admin can create system notifications
      if (!isAdmin) {
         return NextResponse.json(
            { error: "You don't have permission to create system notifications" },
            { status: 403 }
         );
      }

      // Get request body
      const body = await request.json().catch(() => ({}));

      // Validate required fields
      if (!body.title || !body.message) {
         return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
      }

      // Create system notification
      const count = await notificationService.createSystemNotification({
         title: body.title,
         message: body.message,
         type: body.type || "info",
         roles: body.roles || [],
      });

      return NextResponse.json(
         {
            data: { count },
            message: `Created ${count} notifications`,
         },
         { status: 201 }
      );
   } catch (error) {
      console.error("Error creating notifications:", error);
      return NextResponse.json({ error: "Failed to create notifications" }, { status: 500 });
   }
}

// app/api/dashboard/help/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";

/**
 * Get help documentation and resources
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with help content
 */
export async function GET(request) {
   try {
      // Verify authentication
      const { isAuthenticated } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Parse query parameters
      const url = new URL(request.url);
      const topic = url.searchParams.get("topic") || "general";

      const helpContent = getHelpContent(topic);

      return NextResponse.json({ data: helpContent });
   } catch (error) {
      console.error("Error fetching help content:", error);
      return NextResponse.json({ error: "Failed to fetch help content" }, { status: 500 });
   }
}

/**
 * Submit a help request or feedback
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response confirming submission
 */
export async function POST(request) {
   try {
      // Verify authentication
      const { isAuthenticated, user } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Get request body
      const body = await request.json().catch(() => ({}));

      // Validate required fields
      if (!body.subject || !body.message) {
         return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
      }

      // TODO: Store help request in database or send to support system
      const helpRequest = {
         subject: body.subject,
         message: body.message,
         category: body.category || "general",
         userId: user.id || user._id,
         userEmail: user.email,
         submittedAt: new Date(),
         status: "pending",
      };

      // For now, just log the request
      console.log("Help request submitted:", helpRequest);

      return NextResponse.json(
         {
            message: "Help request submitted successfully",
            requestId: Date.now().toString(),
         },
         { status: 201 }
      );
   } catch (error) {
      console.error("Error submitting help request:", error);
      return NextResponse.json({ error: "Failed to submit help request" }, { status: 500 });
   }
}

/**
 * Get help content for a specific topic
 * @param {String} topic - Help topic
 * @returns {Object} - Help content
 */
function getHelpContent(topic) {
   const helpTopics = {
      general: {
         title: "General Help",
         content:
            "Welcome to Nexus Inventory! This system helps you manage your inventory, orders, and warehouse operations.",
         sections: [
            {
               title: "Getting Started",
               content:
                  "Start by adding your products, setting up warehouses, and configuring your inventory settings.",
            },
            {
               title: "Navigation",
               content:
                  "Use the sidebar to navigate between different sections: Dashboard, Products, Inventory, Orders, etc.",
            },
         ],
      },
      products: {
         title: "Products Help",
         content: "Learn how to manage your product catalog.",
         sections: [
            {
               title: "Adding Products",
               content: "Go to Products > Add Product to create new products. Include SKU, name, price, and category.",
            },
            {
               title: "Product Categories",
               content: "Organize products using categories for better management and reporting.",
            },
         ],
      },
      inventory: {
         title: "Inventory Help",
         content: "Manage your stock levels and warehouse operations.",
         sections: [
            {
               title: "Stock Management",
               content: "Track inventory levels across multiple warehouses. Set minimum stock levels for alerts.",
            },
            {
               title: "Stock Adjustments",
               content: "Use the inventory adjustment feature to correct stock levels when needed.",
            },
         ],
      },
      orders: {
         title: "Orders Help",
         content: "Process and manage customer orders.",
         sections: [
            {
               title: "Creating Orders",
               content: "Create new orders by selecting products and specifying quantities.",
            },
            {
               title: "Order Fulfillment",
               content: "Process orders by updating their status and managing inventory accordingly.",
            },
         ],
      },
      reports: {
         title: "Reports Help",
         content: "Generate insights from your data.",
         sections: [
            {
               title: "Available Reports",
               content: "Access sales reports, inventory reports, and product performance analytics.",
            },
            {
               title: "Custom Reports",
               content: "Create custom reports by specifying date ranges and filters.",
            },
         ],
      },
   };

   return helpTopics[topic] || helpTopics.general;
}

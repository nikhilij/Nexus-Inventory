// app/api/dashboard/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { dbConnect } from "@/lib/dbConnect";
import { Product, Order, InventoryItem, Supplier, User, Notification } from "@/models/index";

/**
 * Get dashboard summary data
 * @returns {Promise<NextResponse>} - JSON response with dashboard summary data
 */
export async function GET() {
   try {
      // Verify authentication
      const { isAuthenticated } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      await dbConnect();

      // Get counts from each collection
      const [productsCount, ordersCount, inventoryItemsCount, suppliersCount, usersCount, notificationsCount] =
         await Promise.all([
            Product.countDocuments(),
            Order.countDocuments(),
            InventoryItem.countDocuments(),
            Supplier.countDocuments(),
            User.countDocuments(),
            Notification.countDocuments({ read: false }), // Only unread notifications
         ]);

      // Calculate total inventory value
      const inventoryValueResult = await InventoryItem.aggregate([
         {
            $lookup: {
               from: "products",
               localField: "product",
               foreignField: "_id",
               as: "productData",
            },
         },
         { $unwind: "$productData" },
         {
            $group: {
               _id: null,
               totalValue: { $sum: { $multiply: ["$quantity", "$productData.price"] } },
            },
         },
      ]);

      const totalInventoryValue = inventoryValueResult.length > 0 ? inventoryValueResult[0].totalValue : 0;

      // Get recent orders
      const recentOrders = await Order.find()
         .sort({ createdAt: -1 })
         .limit(5)
         .populate("customer", "name email")
         .select("orderNumber total status createdAt");

      // Get low stock items
      const lowStockItems = await InventoryItem.find({
         $expr: { $lt: ["$quantity", "$minimumQuantity"] },
      })
         .populate("product", "name sku")
         .populate("warehouse", "name")
         .sort({ quantity: 1 })
         .limit(5);

      // Compile dashboard summary data
      const summary = {
         counts: {
            products: productsCount,
            orders: ordersCount,
            inventory: inventoryItemsCount,
            suppliers: suppliersCount,
            users: usersCount,
            notifications: notificationsCount,
         },
         inventoryValue: totalInventoryValue,
         recentOrders,
         lowStockItems,
      };

      return NextResponse.json({ data: summary });
   } catch (error) {
      console.error("Error fetching dashboard data:", error);
      return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
   }
}

/**
 * Update dashboard preferences
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with updated preferences
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

      await dbConnect();

      // Update user preferences
      const userId = user.id || user._id;
      const updatedUser = await User.findByIdAndUpdate(
         userId,
         { $set: { "preferences.dashboard": body } },
         { new: true }
      ).select("preferences.dashboard");

      return NextResponse.json({
         data: updatedUser.preferences?.dashboard || {},
      });
   } catch (error) {
      console.error("Error updating dashboard preferences:", error);
      return NextResponse.json({ error: "Failed to update dashboard preferences" }, { status: 500 });
   }
}

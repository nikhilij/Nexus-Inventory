import { NextResponse } from "next/server";
import { db } from "../_mockDb";

export async function GET() {
   // Return simple summary for dashboard
   const summary = {
      products: db.products.length,
      orders: db.orders.length,
      inventoryItems: db.inventory.length,
      suppliers: db.suppliers.length,
      users: db.users.length,
      notifications: db.notifications.length,
   };

   return NextResponse.json({ data: summary });
}

export async function POST(request) {
   return NextResponse.json({ message: "Dashboard API POST" });
}

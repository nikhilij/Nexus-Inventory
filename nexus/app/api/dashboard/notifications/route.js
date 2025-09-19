// app/api/dashboard/notifications/route.js
import { NextResponse } from "next/server";

export async function GET() {
   return NextResponse.json({ message: "Notifications API" });
}

export async function POST() {
   return NextResponse.json({ message: "Notifications API POST" });
}

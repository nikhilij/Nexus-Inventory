import { NextResponse } from "next/server";
import { list } from "../_mockDb";

export async function GET() {
   const analytics = list("analytics") || {};
   return NextResponse.json({ data: analytics });
}

export async function POST(request) {
   // For analytics POST, we accept events
   const body = await request.json().catch(() => ({}));
   // No persistent storage in mock; echo back
   return NextResponse.json({ received: body }, { status: 202 });
}

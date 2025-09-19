// app/api/dashboard/profile/route.js
import { NextResponse } from "next/server";
import { list, update } from "../_mockDb";

export async function GET() {
   const profile = list("profile") || {};
   return NextResponse.json({ data: profile });
}

export async function POST(request) {
   const body = await request.json().catch(() => ({}));
   const updated = update("profile", null, body);
   return NextResponse.json({ data: updated });
}

// app/api/dashboard/settings/route.js
import { NextResponse } from "next/server";
import { list, create, update } from "../_mockDb";

export async function GET() {
   const settings = list("settings") || {};
   return NextResponse.json({ data: settings });
}

export async function POST(request) {
   const body = await request.json().catch(() => ({}));
   const updated = update("settings", null, body);
   return NextResponse.json({ data: updated });
}

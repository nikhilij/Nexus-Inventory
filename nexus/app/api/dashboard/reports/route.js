// app/api/dashboard/reports/route.js
import { NextResponse } from "next/server";
import { list, create } from "../_mockDb";

export async function GET() {
   const items = list("reports") || [];
   return NextResponse.json({ data: items });
}

export async function POST(request) {
   const body = await request.json().catch(() => ({}));
   const item = create("reports", body);
   return NextResponse.json({ data: item }, { status: 201 });
}

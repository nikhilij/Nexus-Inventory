// app/api/dashboard/suppliers/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Suppliers API' });
}

export async function POST() {
  return NextResponse.json({ message: 'Suppliers API POST' });
}
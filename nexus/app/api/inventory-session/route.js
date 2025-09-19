import { NextResponse } from 'next/server';
import prisma from '../../../../nexus/lib/prisma';

export async function GET(request) {
  try {
    const cookie = request.cookies.get('inventory_session')?.value;
    if (!cookie) return NextResponse.json({ authorized: false });
    const row = await prisma.inventorySession.findUnique({ where: { token: cookie } });
    if (!row) return NextResponse.json({ authorized: false });
    if (row.expiresAt <= new Date()) return NextResponse.json({ authorized: false });
    return NextResponse.json({ authorized: true, user_id: row.userId || null });
  } catch (e) {
    console.error('inventory-session error', e?.message || e);
    return NextResponse.json({ authorized: false });
  }
}

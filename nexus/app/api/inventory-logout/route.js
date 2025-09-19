import { NextResponse } from 'next/server';
import prisma from '../../../../nexus/lib/prisma';

export async function POST(request) {
  try {
    const cookie = request.cookies.get('inventory_session')?.value;
    if (!cookie) return NextResponse.json({ ok: true });
    await prisma.inventorySession.deleteMany({ where: { token: cookie } });
    const res = NextResponse.json({ ok: true });
    res.cookies.set('inventory_session', '', { httpOnly: true, path: '/', maxAge: 0 });
    return res;
  } catch (e) {
    console.error('logout error', e?.message || e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

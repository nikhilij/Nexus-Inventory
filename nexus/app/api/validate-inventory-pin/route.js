import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '../../../../nexus/lib/prisma';

// Simple in-memory rate limiter for demo (IP -> { count, firstAttempt })
const attempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request) {
  try {
    const { pin } = await request.json();
    if (!pin || typeof pin !== 'string') return NextResponse.json({ ok: false, error: 'Missing PIN' }, { status: 400 });

    // rate limiting by IP (best-effort for demo)
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'local';
    const now = Date.now();
    const rec = attempts.get(ip) || { count: 0, first: now };
    if (now - rec.first < WINDOW_MS && rec.count >= MAX_ATTEMPTS) {
      await prisma.auditLog.create({ data: { action: 'pin_rate_limited', ip, meta: { pin } } });
      return NextResponse.json({ ok: false, error: 'Too many attempts. Try later.' }, { status: 429 });
    }

    if (now - rec.first < WINDOW_MS) {
      rec.count += 1;
    } else {
      rec.count = 1; rec.first = now;
    }
    attempts.set(ip, rec);

    // Prisma lookup
    const pinRow = await prisma.inventoryPin.findUnique({ where: { pin } });
    if (!pinRow) {
      await prisma.auditLog.create({ data: { action: 'pin_invalid', ip, meta: { pin } } });
      return NextResponse.json({ ok: false, error: 'Invalid PIN' }, { status: 401 });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

    await prisma.inventorySession.create({ data: { token, userId: pinRow.userId, createdAt, expiresAt } });
    await prisma.auditLog.create({ data: { action: 'pin_valid', ip, meta: { userId: pinRow.userId } } });

    const res = NextResponse.json({ ok: true });
    // More secure cookie flags: HttpOnly, SameSite=Lax, Secure if in production
    res.cookies.set('inventory_session', token, { httpOnly: true, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 });
    return res;
  } catch (e) {
    console.error('validate-inventory-pin error', e?.message || e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

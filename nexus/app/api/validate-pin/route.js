import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { pin } = body || {};
    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ ok: false, error: 'Missing PIN' }, { status: 400 });
    }

    // For demo purposes only: accept 123456 as the valid PIN.
    if (pin === '123456') {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Invalid PIN' }, { status: 401 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 });
  }
}

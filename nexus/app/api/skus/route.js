import { NextResponse } from 'next/server';
import prisma from '../../../../nexus/lib/prisma';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
    const q = url.searchParams.get('q') || '';
    const sort = url.searchParams.get('sort') || 'createdAt';
    const dir = url.searchParams.get('dir') || 'desc';

    const where = q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { sku: { contains: q, mode: 'insensitive' } }] } : {};
    const total = await prisma.sKU.count({ where });
    const items = await prisma.sKU.findMany({ where, orderBy: { [sort]: dir }, skip: (page-1)*pageSize, take: pageSize });
    return NextResponse.json({ total, items });
  } catch (e) {
    console.error('skus GET error', e?.message || e);
    return NextResponse.json({ total: 0, items: [] });
  }
}

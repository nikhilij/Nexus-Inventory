const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: { email: 'demo@example.com', name: 'Demo User' }
  });

  await prisma.inventoryPin.create({ data: { userId: user.id, pin: '24680' } });

  const skus = [
    { sku: 'SKU-1001', name: 'Widget A', description: 'Standard widget', onHand: 120 },
    { sku: 'SKU-1002', name: 'Widget B', description: 'Advanced widget', onHand: 45 },
    { sku: 'SKU-1003', name: 'Gadget X', description: 'Multi-part gadget', onHand: 320 },
  ];

  for (const s of skus) {
    await prisma.sKU.upsert({ where: { sku: s.sku }, update: {}, create: s });
  }

  console.log('Seeding complete');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

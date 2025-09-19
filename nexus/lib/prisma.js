// Mock Prisma client to allow builds when Prisma isn't set up
let prisma;

try {
  const { PrismaClient } = require('@prisma/client');
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
  } else {
    if (!global.__prisma) {
      global.__prisma = new PrismaClient();
    }
    prisma = global.__prisma;
  }
} catch (error) {
  // Mock client when @prisma/client is not available
  console.warn('Prisma client not available, using mock client');
  prisma = {
    user: {
      findUnique: () => Promise.resolve(null),
      create: () => Promise.resolve({}),
      findMany: () => Promise.resolve([]),
    },
    inventoryPin: {
      findFirst: () => Promise.resolve(null),
      create: () => Promise.resolve({}),
      deleteMany: () => Promise.resolve({}),
    },
    inventorySession: {
      findUnique: () => Promise.resolve(null),
      create: () => Promise.resolve({}),
      delete: () => Promise.resolve({}),
    },
    sKU: {
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
    },
    auditLog: {
      create: () => Promise.resolve({}),
    },
  };
}

export default prisma;

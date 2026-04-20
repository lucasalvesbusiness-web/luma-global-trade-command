import { PrismaClient } from '@prisma/client';

declare global {
  var __lumaPrisma: PrismaClient | undefined;
}

export const db =
  globalThis.__lumaPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__lumaPrisma = db;
}

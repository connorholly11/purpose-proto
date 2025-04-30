import { PrismaClient } from '@prisma/client';

// Global declaration to prevent multiple instances during hot reloads
declare global {
  var prisma: PrismaClient | undefined;
}

// Use a single instance of Prisma Client in development
export const prisma = global.prisma || new PrismaClient();

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
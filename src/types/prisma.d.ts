import { PrismaClient as OriginalPrismaClient } from '@prisma/client';

// Declare a module augmentation for Prisma
declare module '@prisma/client' {
  // No need to re-declare PrismaClient, as it should automatically include our schema
}

// Force TypeScript to treat this as a module
export {};

// Extend the PrismaClient with proper typing for our models
declare global {
  type ExtendedPrismaClient = OriginalPrismaClient & {
    // Add any additional methods or properties here
  };
} 
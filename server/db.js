// Database Client - FlowLogic WMS
import { PrismaClient } from './generated/prisma/client.js';
import { withAccelerate } from '@prisma/extension-accelerate';

// Create Prisma client with extensions
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Add Accelerate extension if available
  if (process.env.ACCELERATE_URL) {
    return client.$extends(withAccelerate());
  }

  return client;
};

// Singleton pattern for Prisma client
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient();
} else {
  // In development, prevent hot-reload from creating multiple instances
  if (!global.__prisma) {
    global.__prisma = createPrismaClient();
  }
  prisma = global.__prisma;
}

export { prisma };
export default prisma;

// Database connection wrapper for prisma dev compatibility
// Handles the "prepared statement already exists" error by reconnecting
import { PrismaClient } from '../generated/prisma/client.js';

let prisma = null;

// Create a fresh Prisma client instance
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

// Get the current Prisma client, creating if needed
export function getDb() {
  if (!prisma) {
    prisma = createPrismaClient();
  }
  return prisma;
}

// Reconnect the database (for prisma dev error recovery)
export async function reconnectDb() {
  if (prisma) {
    try {
      await prisma.$disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
  }
  prisma = createPrismaClient();
  await prisma.$connect();
  return prisma;
}

// Execute a database operation with auto-reconnect on prepared statement errors
export async function withDbRetry(operation, maxRetries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const db = getDb();
      return await operation(db);
    } catch (error) {
      lastError = error;

      // Check if it's a prepared statement error
      if (error.message && error.message.includes('prepared statement')) {
        console.log(`Prepared statement error, reconnecting (attempt ${attempt + 1})...`);
        await reconnectDb();
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  throw lastError;
}

// Initialize connection
export async function initDb() {
  prisma = createPrismaClient();
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

export default { getDb, reconnectDb, withDbRetry, initDb };

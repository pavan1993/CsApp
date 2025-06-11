import { PrismaClient } from '@prisma/client';
import { config } from './environment';

let prisma: PrismaClient;

export function connectDatabase(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: config.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }
  return prisma;
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

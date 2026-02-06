import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function getUserByApiKey(apiKey: string) {
  const key = await prisma.apiKey.findUnique({
    where: { key: apiKey, isActive: true },
    include: { user: { include: { subscription: true } } }
  });
  
  if (key) {
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsed: new Date() }
    });
  }
  
  return key;
}

export async function trackUsage(
  userId: string,
  url: string,
  tokensUsed: number,
  processingTimeMs: number,
  success: boolean = true
) {
  await prisma.apiUsage.create({
    data: {
      userId,
      url,
      tokensUsed,
      processingTimeMs,
      success
    }
  });
  
  await prisma.subscription.update({
    where: { userId },
    data: { queriesUsed: { increment: 1 } }
  });
}

export async function checkQuotaLimit(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId }
  });
  
  if (!subscription) return false;
  
  return subscription.queriesUsed < subscription.queriesLimit;
}
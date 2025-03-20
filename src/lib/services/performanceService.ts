import { getPrismaClient } from './prisma';

// Define the type locally
interface PerformanceMetric {
  id: string;
  userId?: string | null;
  conversationId?: string | null;
  feature: string;
  responseTime: number;
  tokensUsed?: number | null;
  cost?: number | null;
  timestamp: Date;
}

/**
 * Track a performance metric
 */
export async function trackPerformance(
  feature: string,
  responseTime: number,
  userId?: string,
  conversationId?: string,
  tokensUsed?: number,
  cost?: number
): Promise<PerformanceMetric> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.performanceMetrics.create({
      data: {
        feature,
        responseTime,
        userId,
        conversationId,
        tokensUsed,
        cost
      }
    });
  });
}

/**
 * Get all performance metrics
 */
export async function getAllPerformanceMetrics(): Promise<PerformanceMetric[]> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.performanceMetrics.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        user: true,
        conversation: true
      }
    });
  });
}

/**
 * Get performance metrics for a specific feature
 */
export async function getMetricsByFeature(feature: string): Promise<PerformanceMetric[]> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.performanceMetrics.findMany({
      where: {
        feature
      },
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        user: true,
        conversation: true
      }
    });
  });
}

/**
 * Get performance metrics for a specific user
 */
export async function getMetricsByUser(userId: string): Promise<PerformanceMetric[]> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.performanceMetrics.findMany({
      where: {
        userId
      },
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        conversation: true
      }
    });
  });
}

/**
 * Get performance metrics for a specific conversation
 */
export async function getMetricsByConversation(conversationId: string): Promise<PerformanceMetric[]> {
  const prisma = getPrismaClient();
  
  return prisma.$transaction(async (tx) => {
    // @ts-ignore - Prisma client hasn't been regenerated yet
    return tx.performanceMetrics.findMany({
      where: {
        conversationId
      },
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        user: true
      }
    });
  });
}

/**
 * Get average performance metrics grouped by feature
 */
export async function getAverageMetricsByFeature(): Promise<Array<{
  feature: string;
  avgResponseTime: number;
  avgTokensUsed: number | null;
  avgCost: number | null;
  count: number;
}>> {
  const prisma = getPrismaClient();
  
  const metrics = await getAllPerformanceMetrics();
  
  // Group by feature
  const featureGroups: Record<string, PerformanceMetric[]> = {};
  
  metrics.forEach(metric => {
    if (!featureGroups[metric.feature]) {
      featureGroups[metric.feature] = [];
    }
    featureGroups[metric.feature].push(metric);
  });
  
  // Calculate averages for each feature
  return Object.entries(featureGroups).map(([feature, metrics]) => {
    const count = metrics.length;
    
    const totalResponseTime = metrics.reduce((sum, metric) => sum + metric.responseTime, 0);
    const avgResponseTime = count > 0 ? totalResponseTime / count : 0;
    
    const metricsWithTokens = metrics.filter(m => m.tokensUsed != null);
    const totalTokens = metricsWithTokens.reduce((sum, metric) => sum + (metric.tokensUsed || 0), 0);
    const avgTokensUsed = metricsWithTokens.length > 0 ? totalTokens / metricsWithTokens.length : null;
    
    const metricsWithCost = metrics.filter(m => m.cost != null);
    const totalCost = metricsWithCost.reduce((sum, metric) => sum + (metric.cost || 0), 0);
    const avgCost = metricsWithCost.length > 0 ? totalCost / metricsWithCost.length : null;
    
    return {
      feature,
      avgResponseTime,
      avgTokensUsed,
      avgCost,
      count
    };
  });
}

/**
 * Calculate cost based on tokens and model
 * 
 * Reference: https://openai.com/pricing
 */
export function calculateCost(tokens: number, model: string = 'gpt-4o'): number {
  // Cost per 1,000 tokens in USD
  const costPer1K: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'text-embedding-3-small': { input: 0.00002, output: 0.00002 },
    'text-embedding-3-large': { input: 0.00013, output: 0.00013 },
    'whisper': { input: 0.006, output: 0.006 }, // $0.006 per minute
    'tts': { input: 0.015, output: 0.015 } // $0.015 per 1,000 characters
  };
  
  // Default to GPT-4o if model not found
  const rateInfo = costPer1K[model] || costPer1K['gpt-4o'];
  
  // For simplicity, assume a 50/50 split between input and output tokens
  // In a real app, you would track input and output tokens separately
  const inputTokens = tokens / 2;
  const outputTokens = tokens / 2;
  
  const inputCost = (inputTokens / 1000) * rateInfo.input;
  const outputCost = (outputTokens / 1000) * rateInfo.output;
  
  return inputCost + outputCost;
} 
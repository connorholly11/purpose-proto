import { RAGAnalytics, RAGOperationData, RetrievedDocumentData } from '@/types';
import { getPrismaClient } from './prisma';

/**
 * Get RAG analytics data for the admin dashboard
 */
export async function getRagAnalytics(userId?: string): Promise<RAGAnalytics> {
  const prisma = getPrismaClient();
  
  try {
    // Use individual queries instead of a transaction to avoid SQL syntax issues
    
    // Total operation count
    const totalCountResult = userId 
      ? await prisma.$queryRaw`SELECT COUNT(*) as count FROM "RAGOperation" WHERE "userId" = ${userId}`
      : await prisma.$queryRaw`SELECT COUNT(*) as count FROM "RAGOperation"`;
    
    // Chat operations count
    const chatCountResult = userId
      ? await prisma.$queryRaw`SELECT COUNT(*) as count FROM "RAGOperation" WHERE "source" = 'chat' AND "userId" = ${userId}`
      : await prisma.$queryRaw`SELECT COUNT(*) as count FROM "RAGOperation" WHERE "source" = 'chat'`;
    
    // Realtime voice operations count
    const realtimeCountResult = userId
      ? await prisma.$queryRaw`SELECT COUNT(*) as count FROM "RAGOperation" WHERE "source" = 'realtime_voice' AND "userId" = ${userId}`
      : await prisma.$queryRaw`SELECT COUNT(*) as count FROM "RAGOperation" WHERE "source" = 'realtime_voice'`;
    
    // Average response time
    const avgTimeResult = userId
      ? await prisma.$queryRaw`SELECT AVG("operationTime") as avg_time FROM "RAGOperation" WHERE "userId" = ${userId}`
      : await prisma.$queryRaw`SELECT AVG("operationTime") as avg_time FROM "RAGOperation"`;
    
    // Operations with successful retrievals
    const successCountResult = userId
      ? await prisma.$queryRaw`
          SELECT COUNT(DISTINCT "RAGOperation".id) as count 
          FROM "RAGOperation" 
          JOIN "RetrievedDocument" ON "RetrievedDocument"."ragOperationId" = "RAGOperation".id
          WHERE "RAGOperation"."userId" = ${userId}
        `
      : await prisma.$queryRaw`
          SELECT COUNT(DISTINCT "RAGOperation".id) as count 
          FROM "RAGOperation" 
          JOIN "RetrievedDocument" ON "RetrievedDocument"."ragOperationId" = "RAGOperation".id
        `;
    
    // Recent operations
    const recentOperations = userId
      ? await prisma.$queryRaw`
          SELECT 
            ro.id, ro.query, ro."conversationId", ro."messageId", ro."userId", 
            ro.timestamp, ro.source, ro."operationTime"
          FROM "RAGOperation" ro
          WHERE ro."userId" = ${userId}
          ORDER BY ro.timestamp DESC
          LIMIT 10
        `
      : await prisma.$queryRaw`
          SELECT 
            ro.id, ro.query, ro."conversationId", ro."messageId", ro."userId", 
            ro.timestamp, ro.source, ro."operationTime"
          FROM "RAGOperation" ro
          ORDER BY ro.timestamp DESC
          LIMIT 10
        `;
    
    // Get retrieved documents for each operation
    const recentOpIds = (recentOperations as any[]).map(op => op.id);
    const retrievedDocs = recentOpIds.length > 0
      ? await prisma.$queryRaw`
          SELECT 
            rd.id, rd."ragOperationId", rd."documentId", rd."similarityScore", 
            rd.content, rd.source
          FROM "RetrievedDocument" rd
          WHERE rd."ragOperationId" IN (${recentOpIds.join(',')})
        `
      : [];
    
    // Get top documents
    const topDocuments = userId
      ? await prisma.$queryRaw`
          SELECT 
            "documentId", 
            COUNT(*) as "retrievalCount",
            MAX("content") as "content"
          FROM "RetrievedDocument"
          JOIN "RAGOperation" ON "RAGOperation"."id" = "RetrievedDocument"."ragOperationId"
          WHERE "RAGOperation"."userId" = ${userId}
          GROUP BY "documentId"
          ORDER BY "retrievalCount" DESC
          LIMIT 5
        `
      : await prisma.$queryRaw`
          SELECT 
            "documentId", 
            COUNT(*) as "retrievalCount",
            MAX("content") as "content"
          FROM "RetrievedDocument"
          JOIN "RAGOperation" ON "RAGOperation"."id" = "RetrievedDocument"."ragOperationId"
          GROUP BY "documentId"
          ORDER BY "retrievalCount" DESC
          LIMIT 5
        `;
    
    // Extract and format the results
    const totalCount = Number((totalCountResult as any)[0]?.count || 0);
    const chatCount = Number((chatCountResult as any)[0]?.count || 0);
    const realtimeCount = Number((realtimeCountResult as any)[0]?.count || 0);
    const avgTime = Number((avgTimeResult as any)[0]?.avg_time || 0);
    const successCount = Number((successCountResult as any)[0]?.count || 0);
    
    // Group retrieved docs by operation ID
    const docsMap: Record<string, any[]> = {};
    (retrievedDocs as any[]).forEach(doc => {
      const opId = doc.ragOperationId;
      if (!docsMap[opId]) {
        docsMap[opId] = [];
      }
      docsMap[opId].push(doc);
    });
    
    // Format top documents
    const formattedTopDocs = (topDocuments as any[]).map(doc => ({
      documentId: doc.documentId,
      retrievalCount: Number(doc.retrievalCount),
      content: doc.content as string
    }));
    
    // Format recent operations
    const formattedRecentOps: RAGOperationData[] = (recentOperations as any[]).map(op => ({
      id: op.id,
      query: op.query,
      conversationId: op.conversationid || undefined,
      messageId: op.messageid || undefined,
      userId: op.userid || undefined,
      timestamp: op.timestamp,
      source: op.source,
      operationTime: Number(op.operationtime),
      retrievedDocs: (docsMap[op.id] || []).map((doc: any) => ({
        id: doc.id,
        documentId: doc.documentId,
        similarityScore: Number(doc.similarityScore),
        content: doc.content,
        source: doc.source || undefined
      }))
    }));
    
    // Return formatted analytics data
    return {
      totalOperations: totalCount,
      avgResponseTime: avgTime,
      successRate: totalCount > 0 ? successCount / totalCount : 0,
      operationsBySource: {
        chat: chatCount,
        realtime_voice: realtimeCount
      },
      topDocuments: formattedTopDocs,
      recentOperations: formattedRecentOps
    };
  } catch (error) {
    console.error('Error getting RAG analytics:', error);
    // Return empty data structure on error
    return {
      totalOperations: 0,
      avgResponseTime: 0,
      successRate: 0,
      operationsBySource: {
        chat: 0,
        realtime_voice: 0
      },
      topDocuments: [],
      recentOperations: []
    };
  }
}

/**
 * Get detailed information about a specific RAG operation
 */
export async function getRagOperationDetails(operationId: string): Promise<RAGOperationData | null> {
  const prisma = getPrismaClient();
  
  try {
    // Get the operation details
    const operation = await prisma.$queryRaw`
      SELECT 
        ro.id, ro.query, ro."conversationId", ro."messageId", ro."userId", 
        ro.timestamp, ro.source, ro."operationTime"
      FROM "RAGOperation" ro
      WHERE ro.id = ${operationId}
    `;
    
    if (!(operation as any[])[0]) return null;
    
    // Get retrieved documents for this operation
    const retrievedDocs = await prisma.$queryRaw`
      SELECT 
        rd.id, rd."documentId", rd."similarityScore", rd.content, rd.source
      FROM "RetrievedDocument" rd
      WHERE rd."ragOperationId" = ${operationId}
    `;
    
    const op = (operation as any[])[0];
    
    return {
      id: op.id,
      query: op.query,
      conversationId: op.conversationid || undefined,
      messageId: op.messageid || undefined,
      userId: op.userid || undefined,
      timestamp: op.timestamp,
      source: op.source,
      operationTime: Number(op.operationtime),
      retrievedDocs: (retrievedDocs as any[]).map((doc: any) => ({
        id: doc.id,
        documentId: doc.documentId,
        similarityScore: Number(doc.similarityScore),
        content: doc.content,
        source: doc.source || undefined
      }))
    };
  } catch (error) {
    console.error('Error getting RAG operation details:', error);
    return null;
  }
} 
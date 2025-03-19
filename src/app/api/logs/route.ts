import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/services/prisma';

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient();
    const url = new URL(request.url);
    
    // Extract filters from URL params
    const userId = url.searchParams.get('userId');
    const liked = url.searchParams.get('liked');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const conversationId = url.searchParams.get('conversationId');
    const search = url.searchParams.get('search');
    
    // Build filter object for Prisma
    const whereClause: any = {
      AND: [] as any[]
    };
    
    // Apply filters if they exist
    if (userId) {
      whereClause.AND.push({
        conversation: {
          userId
        }
      });
    }
    
    if (liked !== null && liked !== undefined) {
      // This would need to be adjusted once we implement message feedback
      if (liked === 'true') {
        whereClause.AND.push({
          feedback: {
            some: {
              type: 'LIKE'
            }
          }
        });
      } else if (liked === 'false') {
        whereClause.AND.push({
          feedback: {
            some: {
              type: 'DISLIKE'
            }
          }
        });
      }
    }
    
    if (dateFrom) {
      whereClause.AND.push({
        createdAt: {
          gte: new Date(dateFrom)
        }
      });
    }
    
    if (dateTo) {
      // Add 1 day to include the end date fully
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      
      whereClause.AND.push({
        createdAt: {
          lt: endDate
        }
      });
    }
    
    if (conversationId) {
      whereClause.AND.push({
        conversationId
      });
    }
    
    if (search) {
      whereClause.AND.push({
        content: {
          contains: search,
          mode: 'insensitive'
        }
      });
    }
    
    // If no filters are applied, remove the AND clause
    if (whereClause.AND.length === 0) {
      delete whereClause.AND;
    }
    
    // Get messages with applied filters
    const messages = await prisma.message.findMany({
      where: whereClause.AND?.length > 0 ? whereClause : {},
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        conversation: {
          select: {
            userId: true
          }
        }
      },
      take: 100 // Limit the number of results
    });
    
    return NextResponse.json({
      messages,
      count: messages.length
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message logs' },
      { status: 500 }
    );
  }
} 
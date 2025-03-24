import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/services/prisma';

export async function GET() {
  // Added environment var check
  if (!process.env.DATABASE_URL) {
    console.error("Warning: No DATABASE_URL found in environment. This might cause 500 errors in production.");
  }

  try {
    const prisma = getPrismaClient();
    
    // Get total conversations
    const totalConversations = await prisma.conversation.count();
    
    // Get total messages
    const totalMessages = await prisma.message.count();
    
    // Calculate average messages per conversation
    const averageMessagesPerConversation = totalConversations > 0 
      ? totalMessages / totalConversations 
      : 0;
    
    // Get messages in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const messagesLast24Hours = await prisma.message.count({
      where: {
        createdAt: {
          gte: oneDayAgo
        }
      }
    });
    
    // Get active users (users who had conversations in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUsers = await prisma.user.count({
      where: {
        conversations: {
          some: {
            messages: {
              some: {
                createdAt: {
                  gte: sevenDaysAgo
                }
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json({
      totalConversations,
      totalMessages,
      averageMessagesPerConversation,
      messagesLast24Hours,
      activeUserCount: activeUsers
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    // Extended error details
    console.error('Full error details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

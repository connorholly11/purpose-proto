import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/services/prisma';

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient();
    
    // Get all users
    const users = await prisma.user.findMany();
    
    // For each user, get their message count and last active timestamp
    const userActivityPromises = users.map(async (user) => {
      // Get message count for this user
      const messageCount = await prisma.message.count({
        where: {
          conversation: {
            userId: user.id
          }
        }
      });
      
      // Get most recent message timestamp for this user
      const latestMessage = await prisma.message.findFirst({
        where: {
          conversation: {
            userId: user.id
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          createdAt: true
        }
      });
      
      return {
        ...user,
        messageCount,
        lastActive: latestMessage?.createdAt || user.createdAt
      };
    });
    
    const userActivity = await Promise.all(userActivityPromises);
    
    // Sort by most recent activity
    userActivity.sort((a, b) => {
      return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
    });
    
    return NextResponse.json({
      users: userActivity
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/services/prisma';

export async function GET(
  request: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    const userId = context.params.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    const userId = context.params.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const prisma = getPrismaClient();
    
    // First check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete all user's related records in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete UserKnowledgeItem records associated with the user
      await tx.userKnowledgeItem.deleteMany({
        where: { userId }
      });
      
      // 2. Get all user's conversations
      const conversations = await tx.conversation.findMany({
        where: { userId }
      });
      
      // 3. Delete messages for each conversation
      for (const conversation of conversations) {
        await tx.message.deleteMany({
          where: { conversationId: conversation.id }
        });
      }
      
      // 4. Delete all user's conversations
      await tx.conversation.deleteMany({
        where: { userId }
      });
      
      // 5. Finally delete the user
      await tx.user.delete({
        where: { id: userId }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    
    // Provide more specific error information
    const errorMessage = error instanceof Error 
      ? `Failed to delete user: ${error.message}` 
      : 'Failed to delete user: Unknown error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

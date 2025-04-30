import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/eval/results
 * Returns evaluation results for a specific promptId or all results if no promptId provided
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if user is authenticated
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. User not authenticated.' },
        { status: 401 }
      );
    }
    
    // In production, you might want to restrict this to admin users
    const FOUNDER_CLERK_IDS = (process.env.FOUNDER_CLERK_IDS || '').split(',');
    const isAdmin = FOUNDER_CLERK_IDS.includes(userId);
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const promptId = searchParams.get('promptId');
    const personaId = searchParams.get('personaId');
    
    let whereClause: any = {};
    
    if (promptId) {
      whereClause.promptId = promptId;
    }
    
    if (personaId) {
      whereClause.personaId = personaId;
    }
    
    // Get evaluation results
    const results = await prisma.evaluation.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        systemPrompt: {
          select: {
            id: true,
            title: true,
            description: true,
            prompt: true,
            modelName: true
          }
        }
      }
    });
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching evaluation results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluation results' },
      { status: 500 }
    );
  }
}
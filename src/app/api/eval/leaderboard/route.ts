import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/eval/leaderboard
 * Returns a leaderboard of system prompts based on evaluation scores
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
    const evaluationMode = searchParams.get('evaluationMode') || 'optimize_good';
    
    // Validate evaluationMode
    if (evaluationMode !== 'optimize_good' && evaluationMode !== 'avoid_bad') {
      return NextResponse.json(
        { error: 'Invalid evaluationMode, must be "optimize_good" or "avoid_bad"' },
        { status: 400 }
      );
    }

    // Get all system prompts with their evaluation metrics
    const systemPrompts = await prisma.systemPrompt.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        modelName: true,
        createdAt: true,
        evaluations: {
          where: {
            evaluationMode: evaluationMode
          },
          select: {
            score: true,
            personaId: true
          }
        }
      }
    });

    // Calculate average scores and total tests run for each prompt
    const leaderboard = systemPrompts.map(prompt => {
      const totalEvaluations = prompt.evaluations.length;
      const totalScore = totalEvaluations > 0 
        ? prompt.evaluations.reduce((sum, eval) => sum + eval.score, 0) 
        : 0;
      const averageScore = totalEvaluations > 0 
        ? totalScore / totalEvaluations 
        : 0;
      
      // Count unique personas tested
      const uniquePersonas = new Set(prompt.evaluations.map(e => e.personaId)).size;
      
      return {
        id: prompt.id,
        title: prompt.title,
        description: prompt.description,
        modelName: prompt.modelName,
        createdAt: prompt.createdAt,
        averageScore,
        totalEvaluations,
        uniquePersonasTested: uniquePersonas
      };
    });

    // Sort by average score (highest first)
    const sortedLeaderboard = leaderboard.sort((a, b) => b.averageScore - a.averageScore);
    
    return NextResponse.json(sortedLeaderboard);
  } catch (error) {
    console.error('Error generating leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to generate leaderboard' },
      { status: 500 }
    );
  }
}
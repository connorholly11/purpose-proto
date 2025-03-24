import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient, createUser } from '@/lib/services/prisma';
import logger from '@/lib/utils/logger';

export async function GET() {
  const prisma = getPrismaClient();
  try {
    logger.info('Users API', 'Fetching all users');
    
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Return empty array if no users; no 500 error
    return NextResponse.json({ users });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('Users API', 'Error fetching users', { error: errorMsg });
    
    // Return empty array instead of failing with 500
    return NextResponse.json({ 
      users: [],
      error: 'An error occurred fetching users. Please verify the database connection.'
    });
  }
}

export async function POST(request: NextRequest) {
  const prisma = getPrismaClient();
  try {
    const body = await request.json();
    const { name } = body;

    logger.info('Users API', 'Creating new user', { name });
    
    if (!name) {
      logger.warn('Users API', 'Name is required for user creation');
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const user = await createUser(name);
    logger.info('Users API', 'User created successfully', { userId: user.id });
    
    return NextResponse.json({ user }, { status: 201 });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('Users API', 'Error creating user', { error: errorMsg });
    
    return NextResponse.json({ 
      error: 'Failed to create user. Please verify the database connection.'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient, createUser } from '@/lib/services/prisma';

export async function GET() {
  // Added environment var check
  if (!process.env.DATABASE_URL) {
    console.error("Warning: No DATABASE_URL found in environment. This might cause 500 errors in production.");
  }

  const prisma = getPrismaClient();
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    // Return empty array if no users; no 500 error
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    // Extended error details
    console.error('Full error details:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Added environment var check
  if (!process.env.DATABASE_URL) {
    console.error("Warning: No DATABASE_URL found in environment. This might cause 500 errors in production.");
  }

  const prisma = getPrismaClient();
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const user = await createUser(name);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    // Extended error details
    console.error('Full error details:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

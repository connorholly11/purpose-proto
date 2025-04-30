import { NextResponse } from 'next/server';
import { clerkMiddleware, clerkClient, createRouteMatcher } from '@clerk/nextjs/server';
import { prisma } from './lib/prisma';

// Check for environment variables
const FOUNDER_CLERK_IDS = (process.env.FOUNDER_CLERK_IDS || '').split(',');

// Helper function to check terms acceptance
async function checkTermsAcceptance(userId: string): Promise<boolean> {
  const termsAcceptance = await prisma.termsAcceptance.findFirst({
    where: {
      userId,
      // We only check the latest version here; could be expanded to check for specific versions
      acceptedAt: { not: null },
    },
  });
  
  return !!termsAcceptance;
}

// Helper function to ensure user exists in DB
async function syncUserIfNeeded(userId: string): Promise<void> {
  // Check if user exists in our database
  const existingUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });
  
  if (!existingUser) {
    try {
      // Get user details from Clerk
      const clerkUser = await clerkClient.users.getUser(userId);
      
      // Default username is the first part of their email or a fallback
      let username = 'user';
      if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
        const email = clerkUser.emailAddresses[0].emailAddress;
        username = email.split('@')[0].toLowerCase();
      }
      
      // Create user in our database
      await prisma.user.create({
        data: {
          clerkId: userId,
          username,
        },
      });
      
      console.log(`Created new user in database: ${userId}`);
    } catch (error) {
      console.error(`Error creating user in database for Clerk ID ${userId}:`, error);
      throw error;
    }
  }
}

// Create a route matcher for public API routes
const isPublicApi = createRouteMatcher(['/api/legal/(.*)', '/api/health']);

// Use the clerkMiddleware with our custom logic
export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;

  // Skip non-API traffic early (keeps edge cost low)
  if (!path.startsWith('/api/')) return;

  // Allow public routes to pass through
  if (isPublicApi(req)) return;

  // Get the user ID from auth directly
  const { userId } = auth;

  // Handle unauthorized requests
  if (!userId) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  // 🔐 Admin check - founders only
  if (path.startsWith('/api/admin')) {
    if (!FOUNDER_CLERK_IDS.includes(userId)) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { 
        status: 403, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
  }

  // 📝 Terms acceptance check
  const isTermsEndpoint = path.startsWith('/api/legal/accept');
  const isTermsAcceptanceEndpoint = path.startsWith('/api/legal/acceptance');

  if (!isTermsEndpoint && !isTermsAcceptanceEndpoint) {
    try {
      const hasAcceptedTerms = await checkTermsAcceptance(userId);
      
      if (!hasAcceptedTerms) {
        return new NextResponse(
          JSON.stringify({
            error: 'Terms and conditions not accepted',
            code: 'terms_required'
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } catch (error) {
      console.error('Error checking terms acceptance:', error);
      // Continue anyway to avoid blocking all requests due to DB issues
    }
  }

  // 👤 Ensure user exists in DB
  try {
    await syncUserIfNeeded(userId);
  } catch (error) {
    console.error('Error syncing user:', error);
    // Continue anyway to avoid blocking all requests due to DB issues
  }
});

export const config = {
  matcher: [
    // Skip static/_next, always run on API & app pages
    '/((?!_next|[^?]*\\.(?:\\w+)).*)',
    '/(api|trpc)(.*)',
  ],
};
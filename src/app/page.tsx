import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to AI Companion</h1>
      
      <SignedIn>
        <p className="mb-4">You are signed in!</p>
        <Link href="/chat" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Go to Chat
        </Link>
      </SignedIn>
      
      <SignedOut>
        <p className="mb-4">Please sign in to continue</p>
        <SignInButton>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Sign In
          </button>
        </SignInButton>
      </SignedOut>
    </main>
  );
}
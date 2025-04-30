import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

/**
 * GET /api/legal/:doc
 * Retrieve the legal document (terms or privacy policy)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { doc: string } }
): Promise<NextResponse> {
  const doc = params.doc; // 'terms' or 'privacy'
  
  if (doc !== 'terms' && doc !== 'privacy') {
    return NextResponse.json(
      { error: 'Invalid document type. Use "terms" or "privacy".' },
      { status: 400 }
    );
  }
  
  try {
    // In Next.js, we adjust the path to be relative to the project root
    const filePath = path.join(process.cwd(), 'frontend/legal', `${doc}-v1.0.md`);
    
    // Check if file exists before trying to read it
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `${doc} document not found.` },
        { status: 404 }
      );
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Return markdown with appropriate content type
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown',
      },
    });
  } catch (error) {
    console.error(`Error retrieving ${doc} document:`, error);
    return NextResponse.json(
      { error: `Error retrieving ${doc} document.` },
      { status: 500 }
    );
  }
}
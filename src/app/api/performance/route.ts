import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllPerformanceMetrics, 
  getMetricsByFeature,
  getMetricsByUser,
  getAverageMetricsByFeature
} from '@/lib/services/performanceService';

// Get performance metrics with optional filters
export async function GET(request: NextRequest) {
  // Added environment var check
  if (!process.env.DATABASE_URL) {
    console.error("Warning: No DATABASE_URL found in environment. This might cause 500 errors in production.");
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const feature = searchParams.get('feature');
    const userId = searchParams.get('userId');
    const averages = searchParams.get('averages') === 'true';
    
    let metrics;
    
    if (averages) {
      // Get average metrics grouped by feature
      metrics = await getAverageMetricsByFeature();
      return NextResponse.json({ metrics });
    } else if (feature) {
      // Get metrics for a specific feature
      metrics = await getMetricsByFeature(feature);
    } else if (userId) {
      // Get metrics for a specific user
      metrics = await getMetricsByUser(userId);
    } else {
      // Get all metrics
      metrics = await getAllPerformanceMetrics();
    }
    
    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    // Extended error details
    console.error('Full error details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

// Helper module to store test progress data
// In a production serverless environment, this would need to be replaced
// with a persisted storage solution (like Redis) since variables don't persist
// between serverless function invocations

// Create a map to store progress for each test run
// This won't work in a true serverless environment without modification
export const testProgressMap = new Map<string, { completed: number, total: number }>();

// Create progress tracking object for a test
export function createProgressTracker(testId: string) {
  return {
    update: (completed: number) => {
      if (testId && testProgressMap.has(testId)) {
        const progress = testProgressMap.get(testId)!;
        progress.completed = completed;
      }
    }
  };
}

// Set up a new test progress tracker
export function initializeTestProgress(testId: string, total: number) {
  testProgressMap.set(testId, { completed: 0, total });
  
  // Auto-cleanup after 5 minutes to prevent memory leaks
  setTimeout(() => {
    if (testProgressMap.has(testId)) {
      testProgressMap.delete(testId);
    }
  }, 5 * 60 * 1000);
  
  return testProgressMap.get(testId);
}

// Get the current progress of a test
export function getTestProgress(testId: string) {
  if (!testProgressMap.has(testId)) {
    // Return zeros if no progress data yet
    return { completed: 0, total: 0 };
  }
  
  // Return current progress data
  const progress = testProgressMap.get(testId);
  
  // Clean up old progress data after test completes
  if (progress && progress.completed >= progress.total) {
    // Wait a bit before cleaning up to ensure all clients get the final update
    setTimeout(() => {
      testProgressMap.delete(testId);
    }, 5000);
  }
  
  return progress;
}
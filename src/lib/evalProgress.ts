// Helper module to store evaluation progress data
// In a production serverless environment, this would need to be replaced
// with a persisted storage solution (like Redis) since variables don't persist
// between serverless function invocations

// Create a map to store progress for each evaluation run
export const evalProgressMap = new Map<string, { completed: number, total: number }>();

// Create progress tracking object for an evaluation
export function createEvalProgressTracker(evalId: string) {
  return {
    update: (completed: number) => {
      if (evalId && evalProgressMap.has(evalId)) {
        const progress = evalProgressMap.get(evalId)!;
        progress.completed = completed;
      }
    }
  };
}

// Set up a new evaluation progress tracker
export function initializeEvalProgress(evalId: string, total: number) {
  evalProgressMap.set(evalId, { completed: 0, total });
  
  // Auto-cleanup after 5 minutes to prevent memory leaks
  setTimeout(() => {
    if (evalProgressMap.has(evalId)) {
      evalProgressMap.delete(evalId);
    }
  }, 5 * 60 * 1000);
  
  return evalProgressMap.get(evalId);
}

// Get the current progress of an evaluation
export function getEvalProgress(evalId: string) {
  if (!evalProgressMap.has(evalId)) {
    // Return zeros if no progress data yet
    return { completed: 0, total: 0 };
  }
  
  // Return current progress data
  const progress = evalProgressMap.get(evalId);
  
  // Clean up old progress data after evaluation completes
  if (progress && progress.completed >= progress.total) {
    // Wait a bit before cleaning up to ensure all clients get the final update
    setTimeout(() => {
      evalProgressMap.delete(evalId);
    }, 5000);
  }
  
  return progress;
}
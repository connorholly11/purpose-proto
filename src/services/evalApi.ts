import axios from 'axios';
import { useAuth } from '@clerk/clerk-expo';

// Define the progress callback type
type ProgressCallback = (completedCalls: number) => void;

// Hook for eval API functionality
export function useEvalApi() {
  const { getToken } = useAuth();

  // Create an axios instance for /api/eval
  const evalApi = axios.create({
    baseURL: __DEV__
      ? 'http://localhost:3001/api/eval'
      : (normalizeUrl(process.env.EXPO_PUBLIC_API_URL || '') + '/api/eval'),
  });

  // Attach auth token if available
  evalApi.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return {
    // Reuse the existing admin route to fetch system prompts
    async getAllSystemPrompts() {
      const baseUrl = __DEV__
        ? 'http://localhost:3001'
        : normalizeUrl(process.env.EXPO_PUBLIC_API_URL || '');
      const adminEndpoint = `${baseUrl}/api/admin/system-prompts`;
      const resp = await axios.get(adminEndpoint, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      return resp.data;
    },

    // Get all persona scenarios
    async getPersonas() {
      const resp = await evalApi.get('/personas');
      return resp.data;
    },

    // Run evaluations for multiple prompts and personas
    async runEval(
      promptIds: string[],
      personaIds: string[],
      progressCallback?: ProgressCallback,
      evaluationMode: string = "optimize_good"
    ) {
      // Generate a unique eval ID for tracking this specific eval run
      const evalId = `eval_${Date.now()}`;
      
      // Start polling for progress updates if callback provided
      let pollInterval: NodeJS.Timeout | null = null;
      
      if (progressCallback) {
        pollInterval = setInterval(async () => {
          try {
            const progressResp = await evalApi.get(`/progress/${evalId}`);
            const { completed, total } = progressResp.data;
            progressCallback(completed);
            
            // If eval is complete, stop polling
            if (completed >= total) {
              if (pollInterval) clearInterval(pollInterval);
            }
          } catch (err) {
            console.error('Error polling eval progress:', err);
          }
        }, 500); // Poll every 500ms
      }

      try {
        // Include the evalId with the request
        const resp = await evalApi.post('/run', { 
          promptIds, 
          personaIds,
          evalId,
          evaluationMode // Pass the evaluation mode
        });
        
        // Ensure polling is stopped
        if (pollInterval) clearInterval(pollInterval);
        
        // Call one final time to ensure we have the final state
        if (progressCallback) {
          const totalCalls = promptIds.length * personaIds.length;
          progressCallback(totalCalls);
        }
        
        return resp.data;
      } catch (err) {
        // Ensure polling is stopped on error too
        if (pollInterval) clearInterval(pollInterval);
        throw err;
      }
    },

    // Run a single evaluation
    async runSingleEval(promptId: string, personaId: string, evaluationMode: string = "optimize_good") {
      const resp = await evalApi.post('/run-single', { promptId, personaId, evaluationMode });
      return resp.data;
    },

    // Get evaluation results
    async getResults(promptId?: string, personaId?: string, limit?: number) {
      const params: Record<string, string | number> = {};
      
      if (promptId) params.promptId = promptId;
      if (personaId) params.personaId = personaId;
      if (limit) params.limit = limit;
      
      const resp = await evalApi.get('/results', { params });
      return resp.data;
    },
    
    // Get the leaderboard data with optional persona and mode filter
    async getLeaderboard(personaId?: string, evaluationMode?: string) {
      const params: Record<string, string> = {};
      
      if (personaId && personaId !== 'overall') {
        params.personaId = personaId;
      }
      
      if (evaluationMode) {
        params.evaluationMode = evaluationMode;
      }
      
      const resp = await evalApi.get('/leaderboard', { params });
      return resp.data;
    },
    
    // Delete an evaluation by ID
    async deleteEvaluation(evaluationId: string) {
      const resp = await evalApi.delete(`/evaluations/${evaluationId}`);
      return resp.data;
    },
  };
}

// Helper function to normalize URLs by removing trailing slashes
function normalizeUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
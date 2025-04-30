export default function ApiDocsPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">API Documentation</h1>
      
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
        <p className="mb-4">All API endpoints require authentication using Clerk. Include the authentication token in the Authorization header:</p>
        <pre className="bg-gray-100 p-4 rounded-md mb-6">
          {`Authorization: Bearer <your_token>`}
        </pre>
      </div>
      
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Chat API</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2">Send Message</h3>
          <p className="mb-2"><strong>POST</strong> /api/chat</p>
          <p className="mb-2">Send a message to the AI and get a response.</p>
          <div className="mb-4">
            <h4 className="font-medium mb-1">Request Body:</h4>
            <pre className="bg-gray-100 p-4 rounded-md">
              {`{
  "message": "Your message text",
  "overridePromptId": "optional-prompt-id-to-use",
  "requestDebugInfo": false,
  "useContext": true,
  "conversationId": "optional-conversation-id"
}`}
            </pre>
          </div>
          <div>
            <h4 className="font-medium mb-1">Response:</h4>
            <pre className="bg-gray-100 p-4 rounded-md">
              {`{
  "reply": "AI response text",
  "conversationId": "unique-conversation-id",
  "isNewConversation": false,
  "debugInfo": {
    // Only if requestDebugInfo is true
  }
}`}
            </pre>
          </div>
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Admin API</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2">System Prompts</h3>
          
          <div className="mb-4">
            <p className="mb-2"><strong>GET</strong> /api/admin/system-prompts</p>
            <p>Get all system prompts.</p>
          </div>
          
          <div className="mb-4">
            <p className="mb-2"><strong>POST</strong> /api/admin/system-prompts</p>
            <p className="mb-2">Create a new system prompt.</p>
            <div className="mb-4">
              <h4 className="font-medium mb-1">Request Body:</h4>
              <pre className="bg-gray-100 p-4 rounded-md">
                {`{
  "title": "Prompt title",
  "description": "Prompt description",
  "prompt": "The system prompt text",
  "modelName": "claude-3-opus-20240229"
}`}
              </pre>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="mb-2"><strong>PUT</strong> /api/admin/system-prompts/:id</p>
            <p>Update an existing system prompt.</p>
          </div>
          
          <div className="mb-4">
            <p className="mb-2"><strong>DELETE</strong> /api/admin/system-prompts/:id</p>
            <p>Delete a system prompt.</p>
          </div>
          
          <div className="mb-4">
            <p className="mb-2"><strong>PUT</strong> /api/admin/system-prompts/:id/activate</p>
            <p>Set a system prompt as the active prompt.</p>
          </div>
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Evaluation API</h2>
        
        <div className="mb-4">
          <p className="mb-2"><strong>GET</strong> /api/eval/personas</p>
          <p>Get all available personas for evaluation.</p>
        </div>
        
        <div className="mb-4">
          <p className="mb-2"><strong>POST</strong> /api/eval/run</p>
          <p className="mb-2">Run a batch evaluation.</p>
          <div className="mb-4">
            <h4 className="font-medium mb-1">Request Body:</h4>
            <pre className="bg-gray-100 p-4 rounded-md">
              {`{
  "promptIds": ["prompt-id-1", "prompt-id-2"],
  "personaIds": ["persona-id-1", "persona-id-2"],
  "evaluationMode": "optimize_good"
}`}
            </pre>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="mb-2"><strong>POST</strong> /api/eval/run-single</p>
          <p className="mb-2">Run a single evaluation test.</p>
        </div>
        
        <div className="mb-4">
          <p className="mb-2"><strong>GET</strong> /api/eval/progress/:evalId</p>
          <p>Get the progress of an ongoing evaluation.</p>
        </div>
        
        <div className="mb-4">
          <p className="mb-2"><strong>GET</strong> /api/eval/results</p>
          <p className="mb-2">Get evaluation results, optionally filtered by promptId or personaId.</p>
        </div>
        
        <div className="mb-4">
          <p className="mb-2"><strong>GET</strong> /api/eval/leaderboard</p>
          <p className="mb-2">Get a leaderboard of system prompts based on evaluation scores.</p>
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Other APIs</h2>
        
        <div className="mb-4">
          <p className="mb-2"><strong>POST</strong> /api/feedback</p>
          <p className="mb-2">Submit user feedback.</p>
        </div>
        
        <div className="mb-4">
          <p className="mb-2"><strong>GET</strong> /api/legal/:doc</p>
          <p className="mb-2">Get legal documents (terms or privacy).</p>
        </div>
        
        <div className="mb-4">
          <p className="mb-2"><strong>POST</strong> /api/legal/accept</p>
          <p className="mb-2">Accept the current terms and conditions.</p>
        </div>
        
        <div className="mb-4">
          <p className="mb-2"><strong>POST</strong> /api/voice/transcribe</p>
          <p className="mb-2">Transcribe an audio file to text.</p>
        </div>
      </div>
    </div>
  );
}
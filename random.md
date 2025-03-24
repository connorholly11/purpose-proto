add text to voice then voice to text via openai's new voice feature



./scripts/rag-test-all.sh "Connor"


-------------


Start your Next.js development server in a separate terminal:
Apply to random.md
Run
dev
Run the comprehensive test suite with logging:
Apply to random.md
Run
./scripts/rag-test-all.sh "Connor"


Analyze the results:
Apply to random.md
Run
./scripts/analyze-log.sh


The log analyzer will automatically check for common issues like:
Database connection problems
Pinecone configuration errors
OpenAI API issues
Embedding generation failures
Low similarity scores
API endpoint problems
These tools will help you identify and fix the issues with your RAG system. The detailed logs will make it easy to track down exactly where the problem is occurring.
If the test is successful but the chat interface still doesn't show proper RAG results, you'll need to check how the retrieval results are integrated into the chat completion logic. But first, these diagnostic tools will help you confirm that the core RAG functionality is working correctly.


Single-threaded personal AI. Chatbots today assume that you’ll have multiple “conversations” and they’ll try to collect memories about you. In practice this is quite clunky. There might be an opportunity to break the mold, and maybe for a narrow usecase (like a truly personal assistant / confidant, rather than a general purpose search engine), have an app where it’s truly just one long chat. It’s all memories and context, that gets compressed in layers of memories over time to fit into the context (much like S3 storage tiers and CPU caches)

NEEDS TO BE ONE LONG CHAT
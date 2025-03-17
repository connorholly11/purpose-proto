import Layout from '@/components/Layout';
import LogsView from '@/components/LogsView';

export default function LogsPage() {
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Conversation History</h1>
        <p className="text-gray-600 mt-2">
          View and rate your past conversations with the AI assistant.
        </p>
      </div>
      <LogsView />
    </Layout>
  );
} 
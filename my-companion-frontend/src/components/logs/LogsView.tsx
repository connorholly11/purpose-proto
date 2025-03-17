'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { fetchLogs, rateConversation, LogEntry } from '@/services/api';
import { toast } from 'sonner';

export const LogsView: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedLogs = await fetchLogs();
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
      setError('Failed to load conversation logs');
      toast.error('Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRate = async (id: string, rating: boolean) => {
    try {
      // Update local state first for immediate feedback
      setLogs((prevLogs) =>
        prevLogs.map((log) =>
          log.id === id ? { ...log, rating } : log
        )
      );
      
      // Send rating to API
      await rateConversation({ id, rating });
      toast.success('Rating updated');
    } catch (error) {
      console.error('Error rating message:', error);
      toast.error('Failed to update rating');
      
      // Revert local state on error
      setLogs((prevLogs) =>
        prevLogs.map((log) =>
          log.id === id ? { ...log, rating: null } : log
        )
      );
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Conversation Logs</h1>
        <Button onClick={loadLogs} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>
      
      {error && (
        <div className="p-4 mb-6 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}
      
      {logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {isLoading ? 'Loading logs...' : 'No conversation logs found.'}
        </div>
      ) : (
        <div className="space-y-6">
          {logs.map((log) => (
            <Card key={log.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    Conversation {new Date(log.timestamp).toLocaleString()}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    LLM: {log.llmUsed}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="font-semibold mb-1">User</div>
                  <div className="pl-4 border-l-2 border-primary/20">{log.userMessage}</div>
                </div>
                
                <div className="mb-4">
                  <div className="font-semibold mb-1">AI Assistant</div>
                  <div className="pl-4 border-l-2 border-primary/20 whitespace-pre-wrap">{log.aiResponse}</div>
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant={log.rating === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleRate(log.id, true)}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Helpful
                  </Button>
                  <Button
                    variant={log.rating === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleRate(log.id, false)}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    Not Helpful
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

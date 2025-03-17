'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface ChatSettingsProps {
  systemPromptMode: 'friendly' | 'challenging';
  setSystemPromptMode: (mode: 'friendly' | 'challenging') => void;
}

export const ChatSettings: React.FC<ChatSettingsProps> = ({
  systemPromptMode,
  setSystemPromptMode,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>System Prompt Mode</Label>
          <div className="flex gap-2">
            <Button
              variant={systemPromptMode === 'friendly' ? 'default' : 'outline'}
              onClick={() => setSystemPromptMode('friendly')}
              className="flex-1"
            >
              Friendly
            </Button>
            <Button
              variant={systemPromptMode === 'challenging' ? 'default' : 'outline'}
              onClick={() => setSystemPromptMode('challenging')}
              className="flex-1"
            >
              Challenging
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {systemPromptMode === 'friendly'
              ? 'Friendly mode provides supportive and encouraging responses.'
              : 'Challenging mode pushes you to think critically and challenges assumptions.'}
          </p>
        </div>

        <div className="space-y-2">
          <Label>LLM Model</Label>
          <div className="flex">
            <Button
              variant="default"
              className="flex-1"
              disabled
            >
              OpenAI GPT-4o
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Using OpenAI's GPT-4o model for advanced conversational capabilities.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

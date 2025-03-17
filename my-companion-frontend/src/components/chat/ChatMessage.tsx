'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Volume2 } from 'lucide-react';
import { textToSpeech } from '@/services/api';
import { toast } from 'sonner';

interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  llmUsed?: string;
  timestamp: string;
  rating?: boolean | null;
  onRate?: (id: string, rating: boolean) => Promise<void>;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  id,
  role,
  content,
  llmUsed,
  timestamp,
  rating,
  onRate,
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePlayAudio = async () => {
    try {
      setIsPlaying(true);
      const response = await textToSpeech({ text: content });
      
      if (response.audioUrl) {
        if (!audioRef.current) {
          audioRef.current = new Audio(response.audioUrl);
          audioRef.current.onended = () => setIsPlaying(false);
        } else {
          audioRef.current.src = response.audioUrl;
        }
        
        audioRef.current.play();
      } else {
        toast.error(response.message || 'Text-to-speech is not available');
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Failed to play audio');
      setIsPlaying(false);
    }
  };

  return (
    <Card className={`mb-4 ${role === 'user' ? 'bg-muted' : 'bg-card'}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className="font-semibold">
            {role === 'user' ? 'You' : 'AI Assistant'}
            {llmUsed && role === 'assistant' && (
              <span className="text-xs ml-2 text-muted-foreground">({llmUsed})</span>
            )}
          </span>
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
        </div>
        
        <div className="whitespace-pre-wrap mb-3">{content}</div>
        
        {role === 'assistant' && (
          <div className="flex justify-between items-center mt-2">
            <div className="flex gap-2">
              {onRate && (
                <>
                  <Button
                    variant={rating === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => onRate(id, true)}
                    aria-label="Thumbs up"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={rating === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => onRate(id, false)}
                    aria-label="Thumbs down"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayAudio}
              disabled={isPlaying}
              aria-label="Play audio"
            >
              <Volume2 className="h-4 w-4 mr-1" />
              {isPlaying ? 'Playing...' : 'Listen'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

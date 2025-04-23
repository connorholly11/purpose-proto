import React, {createContext, useState, useContext, useEffect, ReactNode} from 'react';
import {useApi} from '../hooks/useApi';

// ---- Types ------------------------------------------------------------
export interface SystemPrompt {
  id: string;
  name: string;
  text: string;
  modelName?: string;
  isFavorite?: boolean;
}

export type SystemPromptContextType = {
  prompts: SystemPrompt[];
  activePrompt: SystemPrompt | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setActivePrompt: (id: string) => void;
};

// ---- Default - prevents null checks downstream -----------------------
const SystemPromptContext = createContext<SystemPromptContextType>({
  prompts: [],
  activePrompt: null,
  loading: false,
  error: null,
  refresh: async () => {},
  setActivePrompt: () => {},
});

// ---- Provider ---------------------------------------------------------
export const SystemPromptProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const api = useApi();
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [activePrompt, setActive] = useState<SystemPrompt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const {data} = await api.get('/api/prompts?scope=user');
      setPrompts(data.prompts);
      // Preserve user selection if still present
      if (!activePrompt && data.prompts.length) setActive(data.prompts[0]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const setActivePrompt = (id: string) => {
    const found = prompts.find(p => p.id === id) ?? null;
    setActive(found);
  };

  /* initial fetch */
  useEffect(() => { refresh(); }, []);

  return (
    <SystemPromptContext.Provider value={{prompts, activePrompt, loading, error, refresh, setActivePrompt}}>
      {children}
    </SystemPromptContext.Provider>
  );
};

// ---- Hook -------------------------------------------------------------
export const useSystemPrompts = () => useContext(SystemPromptContext);
import { useEffect, useState } from 'react';
import { fetchSpeakingPrompts } from '../api/speakingPromptsApi';
import type { SpeakingPrompt } from './assessment';

export type PromptsState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly prompts: readonly SpeakingPrompt[] }
  | { readonly kind: 'error'; readonly message: string };

/** IELTS speaking questions from the backend (published, plus dev-only ones in dev). */
export function useSpeakingPrompts(): PromptsState {
  const [state, setState] = useState<PromptsState>({ kind: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetchSpeakingPrompts(controller.signal).then(
      (prompts) => {
        setState({ kind: 'ready', prompts });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState({ kind: 'error', message: error instanceof Error ? error.message : '未知错误' });
        }
      },
    );
    return () => {
      controller.abort();
    };
  }, []);

  return state;
}

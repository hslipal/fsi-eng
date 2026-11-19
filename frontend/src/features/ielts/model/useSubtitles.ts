import { useEffect, useState } from 'react';
import { fetchSubtitles } from '../api/speakingPromptsApi';
import type { SubtitleLine } from './subtitles';

export type SubtitlesState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'none' }
  | { readonly kind: 'ready'; readonly lines: readonly SubtitleLine[] }
  | { readonly kind: 'error'; readonly message: string };

interface Loaded {
  readonly key: string;
  readonly state: SubtitlesState;
}

/** Subtitles of a speaking question's sample answer; `none` when it has none (yet). */
export function useSubtitles(key: string): SubtitlesState {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetchSubtitles(key, controller.signal).then(
      (lines) => {
        setLoaded({ key, state: lines === null ? { kind: 'none' } : { kind: 'ready', lines } });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          const message = error instanceof Error ? error.message : '未知错误';
          setLoaded({ key, state: { kind: 'error', message } });
        }
      },
    );
    return () => {
      controller.abort();
    };
  }, [key]);
  return loaded?.key === key ? loaded.state : { kind: 'loading' };
}

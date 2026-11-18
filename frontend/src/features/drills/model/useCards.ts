import { useEffect, useState } from 'react';
import { fetchCards } from '../api/practiceApi';
import type { Card, Track } from './practice';

export type CardsState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly cards: readonly Card[] }
  | { readonly kind: 'error'; readonly message: string };

interface Loaded {
  readonly track: Track;
  readonly result: CardsState;
}

export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : '未知错误';
}

/** Due cards of one track; a track switch shows `loading` until its cards land. */
export function useCards(track: Track): CardsState {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchCards(track, controller.signal).then(
      (cards) => {
        setLoaded({ track, result: { kind: 'ready', cards } });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setLoaded({ track, result: { kind: 'error', message: describeError(error) } });
        }
      },
    );
    return () => {
      controller.abort();
    };
  }, [track]);

  return loaded?.track === track ? loaded.result : { kind: 'loading' };
}

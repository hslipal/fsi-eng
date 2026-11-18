import { useEffect, useState } from 'react';
import { fetchPublishedItems } from '../api/contentApi';
import type { ContentItem, Track } from './contentItem';

export type ContentState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly items: readonly ContentItem[] }
  | { readonly kind: 'error'; readonly message: string };

interface Loaded {
  readonly track: Track;
  readonly result: ContentState;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : '未知错误';
}

/** Loads the published items of one track; a track switch shows `loading` until its data lands. */
export function useContentItems(track: Track): ContentState {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchPublishedItems(track, controller.signal).then(
      (items) => {
        setLoaded({ track, result: { kind: 'ready', items } });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setLoaded({ track, result: { kind: 'error', message: describe(error) } });
        }
      },
    );
    return () => {
      controller.abort();
    };
  }, [track]);

  if (loaded?.track !== track) {
    return { kind: 'loading' };
  }
  return loaded.result;
}

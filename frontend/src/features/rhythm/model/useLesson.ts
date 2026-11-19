import { useEffect, useState } from 'react';
import { HttpError } from '@/shared/api/httpClient';
import { fetchLesson, fetchLessons } from '../api/rhythmApi';
import type { Lesson, LessonSummary, Track } from './lesson';

export type Loadable<T> =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; readonly value: T };

interface Loaded<T> {
  readonly key: string;
  readonly result: Loadable<T>;
}

export function describeError(error: unknown): string {
  if (error instanceof HttpError && error.status === 404) {
    return '这一课已经不存在了，请回到课程列表。';
  }
  return error instanceof Error ? error.message : '未知错误';
}

function settle<T>(
  key: string,
  promise: Promise<T>,
  signal: AbortSignal,
  set: (loaded: Loaded<T>) => void,
): void {
  promise.then(
    (value) => {
      set({ key, result: { kind: 'ready', value } });
    },
    (error: unknown) => {
      if (!signal.aborted) {
        set({ key, result: { kind: 'error', message: describeError(error) } });
      }
    },
  );
}

/** Lessons of one track; a track switch shows `loading` until its lessons land. */
export function useLessons(track: Track): Loadable<LessonSummary[]> {
  const [loaded, setLoaded] = useState<Loaded<LessonSummary[]> | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    settle(track, fetchLessons(track, controller.signal), controller.signal, setLoaded);
    return () => {
      controller.abort();
    };
  }, [track]);
  return loaded?.key === track ? loaded.result : { kind: 'loading' };
}

/** One lesson with its cards. */
export function useLesson(id: string): Loadable<Lesson> {
  const [loaded, setLoaded] = useState<Loaded<Lesson> | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    settle(id, fetchLesson(id, controller.signal), controller.signal, setLoaded);
    return () => {
      controller.abort();
    };
  }, [id]);
  return loaded?.key === id ? loaded.result : { kind: 'loading' };
}

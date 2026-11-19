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

/** A missing lesson list means the backend predates rhythm training: it needs a restart. */
const OLD_BACKEND =
  '后端没有课程接口，多半还在运行旧版本。请运行 docker compose restart backend，等日志出现 Started 后刷新页面。';
const LESSON_GONE = '这一课已经不存在了，请回到课程列表。';

/** No answer from the backend: the dev proxy reports 5xx while it is starting or restarting. */
const NO_BACKEND = '后端没有响应，可能还在启动。等后端日志出现 Started 后刷新页面。';

export function describeError(error: unknown, notFound?: string): string {
  if (error instanceof HttpError && error.status === 404 && notFound !== undefined) {
    return notFound;
  }
  if ((error instanceof HttpError && error.status >= 500) || error instanceof TypeError) {
    return NO_BACKEND;
  }
  return error instanceof Error ? error.message : '未知错误';
}

interface Pending<T> {
  readonly key: string;
  readonly promise: Promise<T>;
  readonly signal: AbortSignal;
  readonly notFound: string;
}

function settle<T>(
  { key, promise, signal, notFound }: Pending<T>,
  set: (loaded: Loaded<T>) => void,
): void {
  promise.then(
    (value) => {
      set({ key, result: { kind: 'ready', value } });
    },
    (error: unknown) => {
      if (!signal.aborted) {
        set({ key, result: { kind: 'error', message: describeError(error, notFound) } });
      }
    },
  );
}

/** Lessons of one track; a track switch shows `loading` until its lessons land. */
export function useLessons(track: Track): Loadable<LessonSummary[]> {
  const [loaded, setLoaded] = useState<Loaded<LessonSummary[]> | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const promise = fetchLessons(track, controller.signal);
    settle({ key: track, promise, signal: controller.signal, notFound: OLD_BACKEND }, setLoaded);
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
    const promise = fetchLesson(id, controller.signal);
    settle({ key: id, promise, signal: controller.signal, notFound: LESSON_GONE }, setLoaded);
    return () => {
      controller.abort();
    };
  }, [id]);
  return loaded?.key === id ? loaded.result : { kind: 'loading' };
}

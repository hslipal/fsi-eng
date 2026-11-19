import { stubFetchRoutes } from './fetchStub';
import type { RecognitionFactory, RecognitionHandlers } from '@/features/rhythm/model/speech';

/** Test doubles for the rhythm feature: a fake practice API and a fake speech recogniser. */

export const LESSON_ID = '3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90';

const SHARED = { title: 'Things I want', passage: null, options: [] };

const LESSON = {
  id: LESSON_ID,
  title: 'Things I want',
  level: 'ILR 1',
  cards: [
    {
      ...SHARED,
      cardKey: 'k:0:0',
      type: 'substitution',
      instruction: 'Replace the drink.',
      model: 'I want water.',
      cue: 'milk',
      base: null,
    },
    {
      ...SHARED,
      cardKey: 'k:1:0',
      type: 'expansion',
      instruction: 'Change the sentence with the cue.',
      model: "There's a cup on the table.",
      cue: 'spoon',
      base: "There's a cup on the table.",
    },
  ],
};

const SUMMARY = {
  id: LESSON_ID,
  title: 'Things I want',
  level: 'ILR 1',
  steps: [
    { type: 'substitution', count: 1 },
    { type: 'expansion', count: 1 },
  ],
};

const ANSWERS: Readonly<Record<string, string>> = {
  'k:0:0': 'I want milk.',
  'k:1:0': "There's a spoon on the table.",
};

export interface Posted {
  readonly cardKey: string;
  readonly answer: string;
  readonly slow: boolean;
}

function plain(text: string): string {
  return text.toLowerCase().replace(/[.!]$/, '');
}

function parsePosted(body: string): Posted {
  const parsed: unknown = JSON.parse(body);
  const field = (name: string): unknown =>
    typeof parsed === 'object' && parsed !== null ? Reflect.get(parsed, name) : undefined;
  return {
    cardKey: String(field('cardKey')),
    answer: String(field('answer')),
    slow: field('slow') === true,
  };
}

function grade(sent: Posted): { status: number; body: unknown } {
  const expected = ANSWERS[sent.cardKey] ?? '';
  const verdict = plain(sent.answer) === plain(expected) ? 'correct' : 'wrong';
  return { status: 200, body: { verdict, expected, box: 0, nextReviewAt: '2026-11-20T00:00:00Z' } };
}

/** Business has one lesson; other tracks have none. Every posted answer is recorded. */
export function routeRhythmApi(posted: Posted[]): ReturnType<typeof stubFetchRoutes> {
  return stubFetchRoutes((url, init) => {
    if (url.startsWith('/api/practice/lessons?')) {
      return { status: 200, body: url.endsWith('track=business') ? [SUMMARY] : [] };
    }
    if (url === `/api/practice/lessons/${LESSON_ID}`) {
      return { status: 200, body: LESSON };
    }
    if (url === '/api/practice/answers' && typeof init?.body === 'string') {
      const sent = parsePosted(init.body);
      posted.push(sent);
      return grade(sent);
    }
    return { status: 404, body: {} };
  });
}

interface Listener {
  readonly handlers: RecognitionHandlers;
  started: boolean;
  stopped: boolean;
}

/** A recogniser the test drives by calling the handlers of the one that is listening. */
export function fakeSpeech(): {
  readonly factory: RecognitionFactory;
  readonly listeners: readonly Listener[];
  readonly live: () => RecognitionHandlers;
} {
  const listeners: Listener[] = [];
  const factory: RecognitionFactory = (handlers) => {
    const listener: Listener = { handlers, started: false, stopped: false };
    listeners.push(listener);
    return {
      start: () => {
        listener.started = true;
      },
      stop: () => {
        listener.stopped = true;
      },
    };
  };
  const live = (): RecognitionHandlers => {
    const listener = listeners.findLast((candidate) => candidate.started && !candidate.stopped);
    if (listener === undefined) {
      throw new Error('nobody is listening');
    }
    return listener.handlers;
  };
  return { factory, listeners, live };
}

import { stubFetchRoutes } from './fetchStub';
import type { Speaker } from '@/features/rhythm/model/voice';

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
      answer: 'I want milk.',
      modelTranslation: '我想要水。',
      answerTranslation: '我想要牛奶。',
    },
    {
      ...SHARED,
      cardKey: 'k:1:0',
      type: 'expansion',
      instruction: 'Change the sentence with the cue.',
      model: "There's a cup on the table.",
      cue: 'spoon',
      base: "There's a cup on the table.",
      answer: "There's a spoon on the table.",
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
  /** Self-grades only. */
  readonly verdict?: string;
}

function plain(text: string): string {
  return text.toLowerCase().replace(/[.!]$/, '');
}

function parsePosted(body: string): Posted {
  const parsed: unknown = JSON.parse(body);
  const field = (name: string): unknown =>
    typeof parsed === 'object' && parsed !== null ? Reflect.get(parsed, name) : undefined;
  const verdict = field('verdict');
  const posted = {
    cardKey: String(field('cardKey')),
    answer: typeof field('answer') === 'string' ? String(field('answer')) : '',
    slow: field('slow') === true,
  };
  return typeof verdict === 'string' ? { ...posted, verdict } : posted;
}

function grade(sent: Posted): { status: number; body: unknown } {
  const expected = ANSWERS[sent.cardKey] ?? '';
  const verdict = plain(sent.answer) === plain(expected) ? 'correct' : 'wrong';
  return { status: 200, body: { verdict, expected, box: 0, nextReviewAt: '2026-11-20T00:00:00Z' } };
}

function selfGrade(sent: Posted, posted: Posted[]): { status: number; body: unknown } {
  posted.push(sent);
  return {
    status: 200,
    body: {
      verdict: sent.verdict,
      expected: ANSWERS[sent.cardKey] ?? '',
      box: 1,
      nextReviewAt: '2026-11-20T00:00:00Z',
    },
  };
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
    if (url === '/api/practice/self-grades' && typeof init?.body === 'string') {
      return selfGrade(parsePosted(init.body), posted);
    }
    if (url === '/api/practice/answers' && typeof init?.body === 'string') {
      const sent = parsePosted(init.body);
      posted.push(sent);
      return grade(sent);
    }
    return { status: 404, body: {} };
  });
}

/** A speaker that records what it was asked to read and finishes at once. */
export function fakeSpeaker(): { readonly speaker: Speaker; readonly spoken: string[] } {
  const spoken: string[] = [];
  return {
    spoken,
    speaker: {
      speak: async (text) => {
        spoken.push(text);
        await Promise.resolve();
      },
      cancel: () => undefined,
    },
  };
}

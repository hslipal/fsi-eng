import type { Feedback, StepType, Verdict } from './lesson';
import type { Turn } from './plan';

/**
 * tape: FSI tape style. The cue is read aloud, the learner answers aloud in the pause, hears the
 * model answer, repeats it and marks themselves. typing: the learner types and the server grades.
 */
export type InputMode = 'tape' | 'typing';

export const LIMIT_CHOICES = [3, 4, 5, 6, 8, 10] as const;
export const DEFAULT_LIMIT_SECONDS = 5;

/** Typing mode: how long feedback stays before the next prompt. */
export const PAUSE_AFTER_RIGHT_MS = 1200;
export const PAUSE_AFTER_MISS_MS = 3000;

export interface TurnResult {
  readonly type: StepType;
  readonly verdict: Verdict;
  /** From the end of the cue to "done" (tape) or the first keystroke (typing); null if timed out. */
  readonly seconds: number | null;
  readonly slow: boolean;
}

export type Stage =
  | { readonly kind: 'intro' }
  | {
      readonly kind: 'cue';
      /** When the pause started (after the cue was read); null while it is being read. */
      readonly startedAt: number | null;
      /** Typing mode: first keystroke. */
      readonly typedAt: number | null;
      readonly late: boolean;
    }
  | {
      readonly kind: 'reveal';
      readonly seconds: number | null;
      readonly slow: boolean;
      /** Bumped to read the model answer again. */
      readonly reading: number;
      readonly saving: Verdict | null;
    }
  | {
      readonly kind: 'checking';
      readonly answer: string;
      readonly seconds: number | null;
      readonly slow: boolean;
    }
  | {
      readonly kind: 'feedback';
      readonly answer: string;
      readonly feedback: Feedback;
      readonly seconds: number | null;
      readonly slow: boolean;
    }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'done' };

export interface SessionData {
  readonly plan: readonly Turn[];
  readonly limitMs: number;
  readonly index: number;
  readonly stage: Stage;
  readonly results: readonly TurnResult[];
  readonly mode: InputMode;
  /** Typing mode: feedback waits for "next" instead of moving on by itself. */
  readonly paused: boolean;
}

export type Action =
  | { readonly type: 'begin' }
  | { readonly type: 'cue-read'; readonly now: number }
  | { readonly type: 'typed'; readonly now: number }
  | { readonly type: 'late' }
  | { readonly type: 'reveal'; readonly now: number; readonly timedOut: boolean }
  | { readonly type: 'read-again' }
  | { readonly type: 'mark'; readonly verdict: Verdict }
  | { readonly type: 'marked' }
  | { readonly type: 'answered'; readonly text: string; readonly now: number }
  | { readonly type: 'graded'; readonly feedback: Feedback }
  | { readonly type: 'failed'; readonly message: string }
  | { readonly type: 'advance' }
  | { readonly type: 'toggle-pause' };

export function startSession(
  plan: readonly Turn[],
  limitSeconds: number,
  mode: InputMode,
  autoAdvance = true,
): SessionData {
  return {
    plan,
    limitMs: limitSeconds * 1000,
    index: 0,
    stage: plan.length === 0 ? { kind: 'done' } : { kind: 'intro' },
    results: [],
    mode,
    paused: !autoAdvance,
  };
}

export interface StepSummary {
  readonly type: StepType;
  readonly total: number;
  readonly correct: number;
  readonly close: number;
  readonly wrong: number;
  readonly slow: number;
  /** Average over the turns answered in time; null when none were. */
  readonly averageSeconds: number | null;
}

/** Results per drill type, in the order they were practised. */
export function summarize(results: readonly TurnResult[]): StepSummary[] {
  const types = [...new Set(results.map((result) => result.type))];
  return types.map((type) => {
    const mine = results.filter((result) => result.type === type);
    const count = (verdict: Verdict): number =>
      mine.filter((result) => result.verdict === verdict).length;
    const timed = mine.flatMap((result) => (result.seconds === null ? [] : [result.seconds]));
    return {
      type,
      total: mine.length,
      correct: count('correct'),
      close: count('close'),
      wrong: count('wrong'),
      slow: mine.filter((result) => result.slow).length,
      averageSeconds:
        timed.length === 0 ? null : timed.reduce((sum, s) => sum + s, 0) / timed.length,
    };
  });
}

/** Tape mode: when the pause started, while the learner has not said "done". */
export function pauseSince(data: SessionData): number | null {
  const stage = data.stage;
  return data.mode === 'tape' && stage.kind === 'cue' ? stage.startedAt : null;
}

/** Typing mode: when the pause started, while the learner has not started typing in time. */
export function waitingSince(data: SessionData): number | null {
  const stage = data.stage;
  return data.mode === 'typing' && stage.kind === 'cue' && stage.typedAt === null && !stage.late
    ? stage.startedAt
    : null;
}

/** What to read aloud now (changes whenever it should be read again), or null. */
export function toRead(data: SessionData): { readonly key: string; readonly text: string } | null {
  const stage = data.stage;
  const turn = data.plan[data.index];
  if (turn === undefined) {
    return null;
  }
  if (stage.kind === 'cue' && stage.startedAt === null) {
    return { key: `cue:${String(data.index)}`, text: turn.card.cue };
  }
  if (stage.kind === 'reveal') {
    return { key: `answer:${String(data.index)}:${String(stage.reading)}`, text: turn.card.answer };
  }
  return null;
}

/** Typing mode: the answer waiting to be graded. */
export function pendingAnswer(
  data: SessionData,
): { readonly cardKey: string; readonly answer: string; readonly slow: boolean } | null {
  const stage = data.stage;
  const turn = data.plan[data.index];
  return stage.kind === 'checking' && turn !== undefined
    ? { cardKey: turn.card.cardKey, answer: stage.answer, slow: stage.slow }
    : null;
}

/** Tape mode: the learner's verdict waiting to be saved. */
export function pendingMark(
  data: SessionData,
): { readonly cardKey: string; readonly verdict: Verdict; readonly slow: boolean } | null {
  const stage = data.stage;
  const turn = data.plan[data.index];
  return stage.kind === 'reveal' && stage.saving !== null && turn !== undefined
    ? { cardKey: turn.card.cardKey, verdict: stage.saving, slow: stage.slow }
    : null;
}

/** Typing mode: how long feedback stays before moving on; null while paused or not in feedback. */
export function autoAdvanceMs(data: SessionData): number | null {
  const stage = data.stage;
  if (stage.kind !== 'feedback' || data.paused) {
    return null;
  }
  return stage.feedback.verdict === 'correct' && !stage.slow
    ? PAUSE_AFTER_RIGHT_MS
    : PAUSE_AFTER_MISS_MS;
}

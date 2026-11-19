import type { Feedback, StepType, Verdict } from './lesson';
import type { Turn } from './plan';

export type InputMode = 'voice' | 'typing';

export const LIMIT_CHOICES = [3, 4, 5, 6, 8, 10] as const;
export const DEFAULT_LIMIT_SECONDS = 5;

/** How long feedback stays before the next prompt: short when fast and right, longer otherwise. */
export const PAUSE_AFTER_RIGHT_MS = 1200;
export const PAUSE_AFTER_MISS_MS = 3000;

export interface TurnResult {
  readonly type: StepType;
  readonly verdict: Verdict;
  readonly seconds: number;
  readonly slow: boolean;
}

export type Stage =
  | { readonly kind: 'intro' }
  | {
      readonly kind: 'prompt';
      readonly startedAt: number;
      readonly spokeAt: number | null;
      readonly late: boolean;
      readonly heard: string;
      readonly listening: boolean;
      readonly attempt: number;
    }
  | {
      readonly kind: 'checking';
      readonly answer: string;
      readonly seconds: number;
      readonly slow: boolean;
    }
  | {
      readonly kind: 'feedback';
      readonly answer: string;
      readonly feedback: Feedback;
      readonly seconds: number;
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
  readonly notice: string | null;
  readonly paused: boolean;
}

export type Action =
  | { readonly type: 'begin'; readonly now: number }
  | { readonly type: 'speech-start'; readonly now: number }
  | { readonly type: 'interim'; readonly text: string }
  | { readonly type: 'no-speech' }
  | { readonly type: 'retry' }
  | { readonly type: 'late' }
  | { readonly type: 'typing'; readonly notice: string | null }
  | { readonly type: 'answered'; readonly text: string; readonly now: number }
  | { readonly type: 'graded'; readonly feedback: Feedback }
  | { readonly type: 'failed'; readonly message: string }
  | { readonly type: 'advance'; readonly now: number }
  | { readonly type: 'toggle-pause' };

export function startSession(
  plan: readonly Turn[],
  limitSeconds: number,
  mode: InputMode,
): SessionData {
  return {
    plan,
    limitMs: limitSeconds * 1000,
    index: 0,
    stage: plan.length === 0 ? { kind: 'done' } : { kind: 'intro' },
    results: [],
    mode,
    notice: null,
    paused: false,
  };
}

function prompt(data: SessionData, now: number): Stage {
  return {
    kind: 'prompt',
    startedAt: now,
    spokeAt: null,
    late: false,
    heard: '',
    listening: data.mode === 'voice',
    attempt: 0,
  };
}

function answered(data: SessionData, text: string, now: number): SessionData {
  const stage = data.stage;
  const answer = text.trim();
  if (stage.kind !== 'prompt' || answer.length === 0) {
    return data;
  }
  const reactionMs = (stage.spokeAt ?? now) - stage.startedAt;
  const slow = reactionMs > data.limitMs;
  return { ...data, stage: { kind: 'checking', answer, seconds: reactionMs / 1000, slow } };
}

function graded(data: SessionData, feedback: Feedback): SessionData {
  const stage = data.stage;
  const turn = data.plan[data.index];
  if (stage.kind !== 'checking' || turn === undefined) {
    return data;
  }
  const result: TurnResult = {
    type: turn.type,
    verdict: feedback.verdict,
    seconds: stage.seconds,
    slow: stage.slow,
  };
  return {
    ...data,
    stage: { kind: 'feedback', answer: stage.answer, feedback, ...result },
    results: [...data.results, result],
  };
}

function advance(data: SessionData, now: number): SessionData {
  const current = data.plan[data.index];
  const next = data.plan[data.index + 1];
  if (next === undefined) {
    return { ...data, index: data.plan.length, stage: { kind: 'done' } };
  }
  const moved = { ...data, index: data.index + 1, paused: false };
  return next.type === current?.type
    ? { ...moved, stage: prompt(moved, now) }
    : { ...moved, stage: { kind: 'intro' } };
}

type PromptAction = Extract<
  Action,
  { readonly type: 'speech-start' | 'interim' | 'no-speech' | 'retry' | 'late' }
>;

type PromptStage = Extract<Stage, { kind: 'prompt' }>;

function reducePrompt(stage: PromptStage, action: PromptAction, mode: InputMode): PromptStage {
  switch (action.type) {
    case 'speech-start':
      return stage.spokeAt === null ? { ...stage, spokeAt: action.now } : stage;
    case 'interim':
      return { ...stage, heard: action.text };
    case 'no-speech':
      return { ...stage, listening: false };
    case 'retry':
      return { ...stage, listening: mode === 'voice', heard: '', attempt: stage.attempt + 1 };
    case 'late':
      return stage.spokeAt === null ? { ...stage, late: true } : stage;
  }
}

function begin(data: SessionData, now: number): SessionData {
  return data.stage.kind === 'intro' ? { ...data, stage: prompt(data, now) } : data;
}

function toTyping(data: SessionData, notice: string | null): SessionData {
  const stage = data.stage.kind === 'prompt' ? { ...data.stage, listening: false } : data.stage;
  return { ...data, stage, mode: 'typing', notice };
}

function moveOn(data: SessionData, now: number): SessionData {
  return data.stage.kind === 'feedback' ? advance(data, now) : data;
}

const PROMPT_ACTIONS: ReadonlySet<Action['type']> = new Set([
  'speech-start',
  'interim',
  'no-speech',
  'retry',
  'late',
]);

function isPromptAction(action: Action): action is PromptAction {
  return PROMPT_ACTIONS.has(action.type);
}

export function reduce(data: SessionData, action: Action): SessionData {
  if (isPromptAction(action)) {
    return data.stage.kind === 'prompt'
      ? { ...data, stage: reducePrompt(data.stage, action, data.mode) }
      : data;
  }
  switch (action.type) {
    case 'begin':
      return begin(data, action.now);
    case 'typing':
      return toTyping(data, action.notice);
    case 'answered':
      return answered(data, action.text, action.now);
    case 'graded':
      return graded(data, action.feedback);
    case 'failed':
      return { ...data, stage: { kind: 'error', message: action.message } };
    case 'advance':
      return moveOn(data, action.now);
    case 'toggle-pause':
      return { ...data, paused: !data.paused };
  }
}

export interface StepSummary {
  readonly type: StepType;
  readonly total: number;
  readonly correct: number;
  readonly close: number;
  readonly wrong: number;
  readonly slow: number;
  readonly averageSeconds: number;
}

/** Results per drill type, in the order they were practised. */
export function summarize(results: readonly TurnResult[]): StepSummary[] {
  const types = [...new Set(results.map((result) => result.type))];
  return types.map((type) => {
    const mine = results.filter((result) => result.type === type);
    const count = (verdict: Verdict): number =>
      mine.filter((result) => result.verdict === verdict).length;
    const seconds = mine.reduce((sum, result) => sum + result.seconds, 0);
    return {
      type,
      total: mine.length,
      correct: count('correct'),
      close: count('close'),
      wrong: count('wrong'),
      slow: mine.filter((result) => result.slow).length,
      averageSeconds: seconds / mine.length,
    };
  });
}

/** When the current prompt started, while the learner has not started answering in time. */
export function waitingSince(data: SessionData): number | null {
  const stage = data.stage;
  return stage.kind === 'prompt' && stage.spokeAt === null && !stage.late ? stage.startedAt : null;
}

/** Changes whenever the recogniser should (re)start; null when it should not listen. */
export function listenKey(data: SessionData): string | null {
  const stage = data.stage;
  return stage.kind === 'prompt' && stage.listening && data.mode === 'voice'
    ? `${String(data.index)}:${String(stage.attempt)}`
    : null;
}

/** The answer waiting to be graded, with the card it answers. */
export function pendingAnswer(
  data: SessionData,
): { readonly cardKey: string; readonly answer: string; readonly slow: boolean } | null {
  const stage = data.stage;
  const turn = data.plan[data.index];
  return stage.kind === 'checking' && turn !== undefined
    ? { cardKey: turn.card.cardKey, answer: stage.answer, slow: stage.slow }
    : null;
}

/** How long the current feedback stays before moving on; null while paused or not in feedback. */
export function autoAdvanceMs(data: SessionData): number | null {
  const stage = data.stage;
  if (stage.kind !== 'feedback' || data.paused) {
    return null;
  }
  return stage.feedback.verdict === 'correct' && !stage.slow
    ? PAUSE_AFTER_RIGHT_MS
    : PAUSE_AFTER_MISS_MS;
}

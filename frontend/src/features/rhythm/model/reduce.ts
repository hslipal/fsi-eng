import type { Feedback, Verdict } from './lesson';
import type { Action, SessionData, Stage } from './rhythm';

const NEW_CUE: Stage = { kind: 'cue', startedAt: null, typedAt: null, late: false };

type CueStage = Extract<Stage, { kind: 'cue' }>;

function inCue(data: SessionData, change: (stage: CueStage) => Stage): SessionData {
  return data.stage.kind === 'cue' ? { ...data, stage: change(data.stage) } : data;
}

/** Seconds from the end of the cue to `at`, and whether that was over the limit. */
function timing(
  data: SessionData,
  stage: CueStage,
  at: number | null,
): { seconds: number | null; slow: boolean } {
  if (at === null) {
    return { seconds: null, slow: true };
  }
  if (stage.startedAt === null) {
    return { seconds: 0, slow: false };
  }
  const ms = Math.max(0, at - stage.startedAt);
  return { seconds: ms / 1000, slow: ms > data.limitMs };
}

function reveal(data: SessionData, now: number, timedOut: boolean): SessionData {
  return inCue(data, (stage) => ({
    kind: 'reveal',
    ...timing(data, stage, timedOut ? null : now),
    reading: 0,
    saving: null,
  }));
}

function answered(data: SessionData, text: string, now: number): SessionData {
  const answer = text.trim();
  if (answer.length === 0) {
    return data;
  }
  return inCue(data, (stage) => ({
    kind: 'checking',
    answer,
    ...timing(data, stage, stage.typedAt ?? now),
  }));
}

function record(data: SessionData, verdict: Verdict, seconds: number | null, slow: boolean) {
  const turn = data.plan[data.index];
  return turn === undefined
    ? data.results
    : [...data.results, { type: turn.type, verdict, seconds, slow }];
}

function graded(data: SessionData, feedback: Feedback): SessionData {
  const stage = data.stage;
  if (stage.kind !== 'checking') {
    return data;
  }
  return {
    ...data,
    stage: { ...stage, kind: 'feedback', feedback },
    results: record(data, feedback.verdict, stage.seconds, stage.slow),
  };
}

function marked(data: SessionData): SessionData {
  const stage = data.stage;
  if (stage.kind !== 'reveal' || stage.saving === null) {
    return data;
  }
  return advance({ ...data, results: record(data, stage.saving, stage.seconds, stage.slow) });
}

function advance(data: SessionData): SessionData {
  const current = data.plan[data.index];
  const next = data.plan[data.index + 1];
  if (next === undefined) {
    return { ...data, index: data.plan.length, stage: { kind: 'done' } };
  }
  return {
    ...data,
    index: data.index + 1,
    stage: next.type === current?.type ? NEW_CUE : { kind: 'intro' },
  };
}

type CueAction = Extract<
  Action,
  { readonly type: 'begin' | 'cue-read' | 'typed' | 'late' | 'reveal' }
>;
type MarkAction = Extract<Action, { readonly type: 'read-again' | 'mark' | 'marked' }>;
type FlowAction = Exclude<Action, CueAction | MarkAction>;

const CUE_ACTIONS: ReadonlySet<Action['type']> = new Set([
  'begin',
  'cue-read',
  'typed',
  'late',
  'reveal',
]);
const MARK_ACTIONS: ReadonlySet<Action['type']> = new Set(['read-again', 'mark', 'marked']);

function isCueAction(action: Action): action is CueAction {
  return CUE_ACTIONS.has(action.type);
}

function isMarkAction(action: Action): action is MarkAction {
  return MARK_ACTIONS.has(action.type);
}

function reduceCue(data: SessionData, action: CueAction): SessionData {
  switch (action.type) {
    case 'begin':
      return data.stage.kind === 'intro' ? { ...data, stage: NEW_CUE } : data;
    case 'cue-read':
      return inCue(data, (stage) =>
        stage.startedAt === null ? { ...stage, startedAt: action.now } : stage,
      );
    case 'typed':
      return inCue(data, (stage) =>
        stage.typedAt === null ? { ...stage, typedAt: action.now } : stage,
      );
    case 'late':
      return inCue(data, (stage) => (stage.typedAt === null ? { ...stage, late: true } : stage));
    case 'reveal':
      return reveal(data, action.now, action.timedOut);
  }
}

function reduceMark(data: SessionData, action: MarkAction): SessionData {
  const stage = data.stage;
  if (stage.kind !== 'reveal') {
    return data;
  }
  switch (action.type) {
    case 'read-again':
      return { ...data, stage: { ...stage, reading: stage.reading + 1 } };
    case 'mark':
      return stage.saving === null
        ? { ...data, stage: { ...stage, saving: action.verdict } }
        : data;
    case 'marked':
      return marked(data);
  }
}

function reduceFlow(data: SessionData, action: FlowAction): SessionData {
  switch (action.type) {
    case 'answered':
      return answered(data, action.text, action.now);
    case 'graded':
      return graded(data, action.feedback);
    case 'failed':
      return { ...data, stage: { kind: 'error', message: action.message } };
    case 'advance':
      return data.stage.kind === 'feedback' ? advance(data) : data;
    case 'toggle-pause':
      return { ...data, paused: !data.paused };
  }
}

export function reduce(data: SessionData, action: Action): SessionData {
  if (isCueAction(action)) {
    return reduceCue(data, action);
  }
  return isMarkAction(action) ? reduceMark(data, action) : reduceFlow(data, action);
}

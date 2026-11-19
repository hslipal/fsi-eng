import { useEffect, useReducer, type ActionDispatch } from 'react';
import { submitSelfGrade, submitTimedAnswer } from '../api/rhythmApi';
import type { Verdict } from './lesson';
import type { Turn } from './plan';
import {
  autoAdvanceMs,
  pauseSince,
  pendingAnswer,
  pendingMark,
  startSession,
  toRead,
  waitingSince,
  type Action,
  type InputMode,
  type SessionData,
} from './rhythm';
import { reduce } from './reduce';
import { describeError } from './useLesson';
import type { Speaker } from './voice';

type Dispatch = ActionDispatch<[action: Action]>;

export interface SessionOptions {
  readonly limitSeconds: number;
  readonly mode: InputMode;
  /** Typing mode: feedback moves on by itself; otherwise it waits for "next". */
  readonly autoAdvance: boolean;
}

export interface RhythmSession {
  readonly data: SessionData;
  readonly turn: Turn | undefined;
  readonly begin: () => void;
  /** Tape mode: the learner has said the answer. */
  readonly done: () => void;
  readonly readAgain: () => void;
  readonly mark: (verdict: Verdict) => void;
  /** Typing mode. */
  readonly typed: () => void;
  readonly answer: (text: string) => void;
  readonly next: () => void;
  readonly togglePause: () => void;
}

function useReading(data: SessionData, speaker: Speaker | null, dispatch: Dispatch): void {
  const reading = toRead(data);
  const key = reading?.key ?? null;
  const text = reading?.text ?? '';
  useEffect(() => {
    if (key === null) {
      return undefined;
    }
    let current = true;
    const cueRead = (): void => {
      if (current && key.startsWith('cue:')) {
        dispatch({ type: 'cue-read', now: Date.now() });
      }
    };
    if (speaker === null) {
      cueRead();
    } else {
      void speaker.speak(text).then(cueRead);
    }
    return () => {
      current = false;
      speaker?.cancel();
    };
  }, [key, text, speaker, dispatch]);
}

const LATE: Action = { type: 'late' };

function useTimer(
  since: number | null,
  limitMs: number,
  timeout: Action,
  dispatch: Dispatch,
): void {
  useEffect(() => {
    if (since === null) {
      return undefined;
    }
    const timer = setTimeout(
      () => {
        dispatch(timeout.type === 'reveal' ? { ...timeout, now: Date.now() } : timeout);
      },
      Math.max(0, limitMs - (Date.now() - since)),
    );
    return () => {
      clearTimeout(timer);
    };
  }, [since, limitMs, timeout, dispatch]);
}

const TIMED_OUT: Action = { type: 'reveal', now: 0, timedOut: true };

function useGrading(data: SessionData, dispatch: Dispatch): void {
  const pending = pendingAnswer(data);
  const cardKey = pending?.cardKey ?? null;
  const answer = pending?.answer ?? '';
  const slow = pending?.slow ?? false;
  useEffect(() => {
    if (cardKey === null) {
      return undefined;
    }
    let current = true;
    submitTimedAnswer(cardKey, answer, slow).then(
      (feedback) => {
        if (current) {
          dispatch({ type: 'graded', feedback });
        }
      },
      (error: unknown) => {
        if (current) {
          dispatch({ type: 'failed', message: describeError(error) });
        }
      },
    );
    return () => {
      current = false;
    };
  }, [cardKey, answer, slow, dispatch]);
}

function useMarking(data: SessionData, dispatch: Dispatch): void {
  const pending = pendingMark(data);
  const cardKey = pending?.cardKey ?? null;
  const verdict = pending?.verdict ?? null;
  const slow = pending?.slow ?? false;
  useEffect(() => {
    if (cardKey === null || verdict === null) {
      return undefined;
    }
    let current = true;
    submitSelfGrade(cardKey, verdict, slow).then(
      () => {
        if (current) {
          dispatch({ type: 'marked' });
        }
      },
      (error: unknown) => {
        if (current) {
          dispatch({ type: 'failed', message: describeError(error) });
        }
      },
    );
    return () => {
      current = false;
    };
  }, [cardKey, verdict, slow, dispatch]);
}

function useAutoAdvance(data: SessionData, dispatch: Dispatch): void {
  const delay = autoAdvanceMs(data);
  const index = data.index;
  useEffect(() => {
    if (delay === null) {
      return undefined;
    }
    const timer = setTimeout(() => {
      dispatch({ type: 'advance' });
    }, delay);
    return () => {
      clearTimeout(timer);
    };
  }, [delay, index, dispatch]);
}

/**
 * A timed FSI lesson. Tape mode: each cue is read aloud, the learner answers aloud within the
 * pause, hears the model answer, repeats it and marks themselves. Typing mode: the learner types
 * and the server grades.
 */
export function useRhythmSession(
  plan: readonly Turn[],
  options: SessionOptions,
  speaker: Speaker | null,
): RhythmSession {
  const [data, dispatch] = useReducer(reduce, null, () =>
    startSession(plan, options.limitSeconds, options.mode, options.autoAdvance),
  );
  useReading(data, speaker, dispatch);
  useTimer(pauseSince(data), data.limitMs, TIMED_OUT, dispatch);
  useTimer(waitingSince(data), data.limitMs, LATE, dispatch);
  useGrading(data, dispatch);
  useMarking(data, dispatch);
  useAutoAdvance(data, dispatch);

  return {
    data,
    turn: data.plan[data.index],
    begin: () => {
      dispatch({ type: 'begin' });
    },
    done: () => {
      dispatch({ type: 'reveal', now: Date.now(), timedOut: false });
    },
    readAgain: () => {
      dispatch({ type: 'read-again' });
    },
    mark: (verdict) => {
      dispatch({ type: 'mark', verdict });
    },
    typed: () => {
      dispatch({ type: 'typed', now: Date.now() });
    },
    answer: (text) => {
      dispatch({ type: 'answered', text, now: Date.now() });
    },
    next: () => {
      dispatch({ type: 'advance' });
    },
    togglePause: () => {
      dispatch({ type: 'toggle-pause' });
    },
  };
}

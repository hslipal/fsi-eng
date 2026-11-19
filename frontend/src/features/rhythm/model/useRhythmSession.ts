import { useEffect, useReducer, type ActionDispatch } from 'react';
import { submitTimedAnswer } from '../api/rhythmApi';
import type { Turn } from './plan';
import {
  autoAdvanceMs,
  listenKey,
  pendingAnswer,
  reduce,
  startSession,
  waitingSince,
  type Action,
  type InputMode,
  type SessionData,
} from './rhythm';
import { FATAL_SPEECH_ERRORS, type RecognitionFactory } from './speech';
import { describeError } from './useLesson';

type Dispatch = ActionDispatch<[action: Action]>;

export interface RhythmSession {
  readonly data: SessionData;
  readonly turn: Turn | undefined;
  /** From a drill's introduction to its first prompt. */
  readonly begin: () => void;
  /** Typing mode: the first keystroke ends the reaction time. */
  readonly startTyping: () => void;
  readonly answer: (text: string) => void;
  /** Voice mode: listen again after nothing was heard. */
  readonly retry: () => void;
  readonly switchToTyping: () => void;
  readonly next: () => void;
  readonly togglePause: () => void;
}

const MIC_BLOCKED = '无法使用麦克风，已改为打字作答。可以在浏览器地址栏允许麦克风后刷新页面。';

function useLateReminder(data: SessionData, dispatch: Dispatch): void {
  const since = waitingSince(data);
  const limitMs = data.limitMs;
  useEffect(() => {
    if (since === null) {
      return undefined;
    }
    const timer = setTimeout(
      () => {
        dispatch({ type: 'late' });
      },
      Math.max(0, limitMs - (Date.now() - since)),
    );
    return () => {
      clearTimeout(timer);
    };
  }, [since, limitMs, dispatch]);
}

function useListening(
  data: SessionData,
  recognition: RecognitionFactory | null,
  dispatch: Dispatch,
): void {
  const key = listenKey(data);
  useEffect(() => {
    if (key === null || recognition === null) {
      return undefined;
    }
    const listener = recognition({
      onSpeechStart: () => {
        dispatch({ type: 'speech-start', now: Date.now() });
      },
      onInterim: (text) => {
        dispatch({ type: 'interim', text });
      },
      onResult: (text) => {
        dispatch({ type: 'answered', text, now: Date.now() });
      },
      onNoSpeech: () => {
        dispatch({ type: 'no-speech' });
      },
      onError: (code) => {
        dispatch(
          FATAL_SPEECH_ERRORS.includes(code)
            ? { type: 'typing', notice: MIC_BLOCKED }
            : { type: 'no-speech' },
        );
      },
    });
    listener.start();
    return () => {
      listener.stop();
    };
  }, [key, recognition, dispatch]);
}

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

function useAutoAdvance(data: SessionData, dispatch: Dispatch): void {
  const delay = autoAdvanceMs(data);
  const index = data.index;
  useEffect(() => {
    if (delay === null) {
      return undefined;
    }
    const timer = setTimeout(() => {
      dispatch({ type: 'advance', now: Date.now() });
    }, delay);
    return () => {
      clearTimeout(timer);
    };
  }, [delay, index, dispatch]);
}

/**
 * A timed FSI lesson: every prompt starts a clock and the learner should start answering within
 * the limit. Spoken answers are recognised in the browser and graded by the server; feedback moves
 * on by itself unless paused.
 */
export interface SessionOptions {
  readonly limitSeconds: number;
  readonly mode: InputMode;
  /** Feedback moves on by itself; otherwise it waits for "next". */
  readonly autoAdvance: boolean;
}

export function useRhythmSession(
  plan: readonly Turn[],
  options: SessionOptions,
  recognition: RecognitionFactory | null,
): RhythmSession {
  const { limitSeconds, mode, autoAdvance } = options;
  const [data, dispatch] = useReducer(reduce, null, () =>
    startSession(plan, limitSeconds, recognition === null ? 'typing' : mode, autoAdvance),
  );
  useLateReminder(data, dispatch);
  useListening(data, recognition, dispatch);
  useGrading(data, dispatch);
  useAutoAdvance(data, dispatch);

  const now = (): number => Date.now();
  return {
    data,
    turn: data.plan[data.index],
    begin: () => {
      dispatch({ type: 'begin', now: now() });
    },
    startTyping: () => {
      dispatch({ type: 'speech-start', now: now() });
    },
    answer: (text) => {
      dispatch({ type: 'answered', text, now: now() });
    },
    retry: () => {
      dispatch({ type: 'retry' });
    },
    switchToTyping: () => {
      dispatch({ type: 'typing', notice: null });
    },
    next: () => {
      dispatch({ type: 'advance', now: now() });
    },
    togglePause: () => {
      dispatch({ type: 'toggle-pause' });
    },
  };
}

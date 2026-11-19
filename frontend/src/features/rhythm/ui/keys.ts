import { useEffect } from 'react';
import type { Verdict } from '../model/lesson';
import type { RhythmSession } from '../model/useRhythmSession';

const MARK_KEYS: Readonly<Record<string, Verdict>> = { '1': 'correct', '2': 'close', '3': 'wrong' };

/** Tape mode keys: space or Enter = done; 1/2/3 = mark; R = read the answer again. */
function onTapeKey(kind: 'cue' | 'reveal', key: string, session: RhythmSession): boolean {
  if (kind === 'cue') {
    if (key === ' ' || key === 'enter') {
      session.done();
      return true;
    }
    return false;
  }
  const verdict = MARK_KEYS[key];
  if (verdict !== undefined) {
    session.mark(verdict);
    return true;
  }
  if (key === 'r') {
    session.readAgain();
    return true;
  }
  return false;
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLSelectElement;
}

export function useTapeKeys(session: RhythmSession): void {
  const stage = session.data.stage.kind;
  const kind =
    session.data.mode === 'tape' && (stage === 'cue' || stage === 'reveal') ? stage : null;
  useEffect(() => {
    if (kind === null) {
      return undefined;
    }
    const onKey = (event: KeyboardEvent): void => {
      if (
        !event.repeat &&
        !isTyping(event.target) &&
        onTapeKey(kind, event.key.toLowerCase(), session)
      ) {
        event.preventDefault();
      }
    };
    globalThis.addEventListener('keydown', onKey);
    return () => {
      globalThis.removeEventListener('keydown', onKey);
    };
  }, [kind, session]);
}

/** T toggles the translation layer anywhere in the lesson, except while typing an answer. */
export function useTranslationKey(onToggle: () => void): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (!event.repeat && !isTyping(event.target) && event.key.toLowerCase() === 't') {
        onToggle();
      }
    };
    globalThis.addEventListener('keydown', onKey);
    return () => {
      globalThis.removeEventListener('keydown', onKey);
    };
  }, [onToggle]);
}

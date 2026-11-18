import { useState } from 'react';
import { submitAnswer } from '../api/practiceApi';
import type { Card, Feedback, Track } from './practice';
import { describeError, useCards, type CardsState } from './useCards';

export type SessionState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'done'; readonly answered: number }
  | {
      readonly kind: 'question';
      readonly card: Card;
      readonly position: number;
      readonly total: number;
    }
  | {
      readonly kind: 'feedback';
      readonly card: Card;
      readonly position: number;
      readonly total: number;
      readonly feedback: Feedback;
    };

export interface PracticeSession {
  readonly state: SessionState;
  readonly submit: (answer: string) => Promise<void>;
  readonly next: () => void;
}

interface Progress {
  readonly track: Track;
  readonly index: number;
  readonly feedback: Feedback | null;
  readonly error: string | null;
}

function start(track: Track): Progress {
  return { track, index: 0, feedback: null, error: null };
}

function toState(cards: CardsState, progress: Progress): SessionState {
  if (cards.kind !== 'ready') {
    return cards;
  }
  if (progress.error !== null) {
    return { kind: 'error', message: progress.error };
  }
  const card = cards.cards[progress.index];
  if (card === undefined) {
    return { kind: 'done', answered: progress.index };
  }
  const where = { card, position: progress.index + 1, total: cards.cards.length };
  return progress.feedback === null
    ? { kind: 'question', ...where }
    : { kind: 'feedback', ...where, feedback: progress.feedback };
}

/** One pass through the due cards of a track: answer, see feedback, go to the next card. */
export function usePracticeSession(track: Track): PracticeSession {
  const cards = useCards(track);
  const [stored, setProgress] = useState<Progress>(() => start(track));
  const progress = stored.track === track ? stored : start(track);
  const state = toState(cards, progress);

  const submit = async (answer: string): Promise<void> => {
    if (state.kind !== 'question') {
      return;
    }
    try {
      const feedback = await submitAnswer(state.card.cardKey, answer);
      setProgress({ ...progress, feedback });
    } catch (error: unknown) {
      setProgress({ ...progress, error: describeError(error) });
    }
  };

  const next = (): void => {
    setProgress({ track, index: progress.index + 1, feedback: null, error: null });
  };

  return { state, submit, next };
}

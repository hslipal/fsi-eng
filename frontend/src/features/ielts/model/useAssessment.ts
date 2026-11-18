import { useState } from 'react';
import { HttpError } from '@/shared/api/httpClient';
import { assessSpeaking, assessWriting } from '../api/assessmentApi';
import type { Assessment, WritingTask } from './assessment';

export type AssessmentState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'scoring' }
  | { readonly kind: 'scored'; readonly result: Assessment }
  | { readonly kind: 'error'; readonly message: string };

export interface AssessmentRun {
  readonly state: AssessmentState;
  readonly scoreWriting: (task: WritingTask, prompt: string, essay: string) => Promise<void>;
  readonly scoreSpeaking: (part: number, question: string, audio: File) => Promise<void>;
}

function describe(error: unknown): string {
  if (error instanceof HttpError && error.status === 503) {
    return 'AI 评分暂时不可用，请稍后再试。';
  }
  return error instanceof Error ? error.message : '未知错误';
}

/** Runs one scoring request at a time and keeps its result. */
export function useAssessment(): AssessmentRun {
  const [state, setState] = useState<AssessmentState>({ kind: 'idle' });

  const run = async (request: () => Promise<Assessment>): Promise<void> => {
    setState({ kind: 'scoring' });
    try {
      setState({ kind: 'scored', result: await request() });
    } catch (error: unknown) {
      setState({ kind: 'error', message: describe(error) });
    }
  };

  return {
    state,
    scoreWriting: (task, prompt, essay) => run(() => assessWriting(task, prompt, essay)),
    scoreSpeaking: (part, question, audio) => run(() => assessSpeaking(part, question, audio)),
  };
}

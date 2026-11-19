/**
 * Speech recognition for spoken answers. Uses the browser's Web Speech API (Chrome and Edge send
 * the audio to their vendor's servers to recognise it; Firefox has none). Without it the learner
 * types instead.
 */

export interface RecognitionHandlers {
  /** The learner started speaking: this ends the reaction time. */
  readonly onSpeechStart: () => void;
  /** Words recognised so far, while the learner is still speaking. */
  readonly onInterim: (text: string) => void;
  /** The final transcript of one answer. */
  readonly onResult: (text: string) => void;
  /** Listening ended without any words. */
  readonly onNoSpeech: () => void;
  /** The microphone is blocked or missing, or recognition failed for another reason. */
  readonly onError: (code: string) => void;
}

export interface Recognition {
  readonly start: () => void;
  readonly stop: () => void;
}

export type RecognitionFactory = (handlers: RecognitionHandlers) => Recognition;

/** Errors that will not go away by trying again: switch to typing. */
export const FATAL_SPEECH_ERRORS: readonly string[] = [
  'not-allowed',
  'service-not-allowed',
  'audio-capture',
  'language-not-supported',
];

interface Alternative {
  readonly transcript: string;
}

interface Result {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: Alternative | undefined;
}

interface ResultList {
  readonly length: number;
  readonly [index: number]: Result | undefined;
}

/** The part of the browser's SpeechRecognition object this module uses. */
interface BrowserRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onspeechstart: (() => void) | null;
  onresult: ((event: { readonly results: ResultList }) => void) | null;
  onerror: ((event: { readonly error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
}

type BrowserRecognitionClass = new () => BrowserRecognition;

function isRecognitionClass(value: unknown): value is BrowserRecognitionClass {
  return typeof value === 'function';
}

function transcriptOf(results: ResultList): { readonly text: string; readonly final: boolean } {
  let text = '';
  let final = results.length > 0;
  for (const result of Array.from(results)) {
    text += result?.[0]?.transcript ?? '';
    final = final && result?.isFinal === true;
  }
  return { text: text.trim(), final };
}

function wire(recognition: BrowserRecognition, handlers: RecognitionHandlers): void {
  let heard = false;
  let failed = false;
  recognition.onspeechstart = () => {
    handlers.onSpeechStart();
  };
  recognition.onresult = (event) => {
    const { text, final } = transcriptOf(event.results);
    if (text.length === 0) {
      return;
    }
    if (final) {
      heard = true;
      handlers.onResult(text);
    } else {
      handlers.onInterim(text);
    }
  };
  recognition.onerror = (event) => {
    if (event.error === 'no-speech' || event.error === 'aborted') {
      return;
    }
    failed = true;
    handlers.onError(event.error);
  };
  recognition.onend = () => {
    if (!heard && !failed) {
      handlers.onNoSpeech();
    }
  };
}

/** The browser's recogniser for English answers, or null when the browser has none. */
export function browserRecognition(): RecognitionFactory | null {
  const found: unknown =
    Reflect.get(globalThis, 'SpeechRecognition') ??
    Reflect.get(globalThis, 'webkitSpeechRecognition');
  if (!isRecognitionClass(found)) {
    return null;
  }
  const RecognitionClass = found;
  return (handlers) => {
    const recognition = new RecognitionClass();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    wire(recognition, handlers);
    return {
      start: () => {
        recognition.start();
      },
      stop: () => {
        recognition.onend = null;
        recognition.abort();
      },
    };
  };
}

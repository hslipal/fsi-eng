/**
 * Reads cues and model answers aloud with the browser's speech synthesis (FSI tape style: the
 * learner hears the cue, answers aloud, then hears the model answer). Nothing is recorded or sent
 * anywhere; voices come from the operating system or browser.
 */

export interface Speaker {
  /** Resolves when the text has been read (or reading failed or was cancelled). */
  readonly speak: (text: string) => Promise<void>;
  readonly cancel: () => void;
}

export const RATE_CHOICES = [
  { value: 0.8, label: '慢速' },
  { value: 1, label: '正常' },
] as const;

function englishVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = synth.getVoices().filter((voice) => voice.lang.startsWith('en'));
  return (
    voices.find((voice) => voice.lang === 'en-US' && !voice.localService) ??
    voices.find((voice) => voice.lang === 'en-US') ??
    voices[0] ??
    null
  );
}

/**
 * Some browsers never report the end of an utterance; stop waiting after roughly how long the
 * text takes to read, so a drill cannot get stuck.
 */
export function readingTimeoutMs(text: string, rate: number): number {
  return Math.round((1500 + text.length * 90) / rate);
}

function canSpeak(): boolean {
  const synth: unknown = Reflect.get(globalThis, 'speechSynthesis');
  return synth !== undefined && synth !== null && typeof SpeechSynthesisUtterance !== 'undefined';
}

/** The browser's English speaker, or null when the browser cannot read aloud. */
export function browserSpeaker(rate: number): Speaker | null {
  if (!canSpeak()) {
    return null;
  }
  const synth = globalThis.speechSynthesis;
  return {
    speak: (text) =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, readingTimeoutMs(text, rate));
        const finish = (): void => {
          clearTimeout(timer);
          resolve();
        };
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = rate;
        utterance.voice = englishVoice(synth);
        utterance.onend = finish;
        utterance.onerror = finish;
        synth.cancel();
        synth.speak(utterance);
      }),
    cancel: () => {
      synth.cancel();
    },
  };
}

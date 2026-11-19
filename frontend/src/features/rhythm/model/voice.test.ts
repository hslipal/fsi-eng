import { browserSpeaker, readingTimeoutMs } from './voice';

class FakeUtterance {
  lang = '';
  rate = 1;
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readonly text: string;
  constructor(text: string) {
    this.text = text;
  }
}

describe('browserSpeaker', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is null when the browser cannot read aloud', () => {
    expect(browserSpeaker(1)).toBeNull();
  });

  it('reads English at the chosen rate with an English voice and resolves when done', async () => {
    const spoken: FakeUtterance[] = [];
    const english = { lang: 'en-US', localService: true };
    const synth = {
      getVoices: () => [{ lang: 'zh-CN', localService: true }, english],
      cancel: vi.fn(),
      speak: (utterance: FakeUtterance) => {
        spoken.push(utterance);
        utterance.onend?.();
      },
    };
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);

    const speaker = browserSpeaker(0.8);
    await speaker?.speak('I want milk.');
    speaker?.cancel();

    expect(spoken[0]).toMatchObject({
      text: 'I want milk.',
      lang: 'en-US',
      rate: 0.8,
      voice: english,
    });
    expect(synth.cancel).toHaveBeenCalledTimes(2);
  });

  it('resolves when reading fails and copes without English voices', async () => {
    const synth = {
      getVoices: () => [],
      cancel: vi.fn(),
      speak: (utterance: FakeUtterance) => {
        utterance.onerror?.();
      },
    };
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);

    await expect(browserSpeaker(1)?.speak('Hello.')).resolves.toBeUndefined();
  });

  it('stops waiting when the browser never reports the end', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('speechSynthesis', { getVoices: () => [], cancel: vi.fn(), speak: vi.fn() });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);

    const done = browserSpeaker(1)?.speak('Hello.');
    vi.advanceTimersByTime(readingTimeoutMs('Hello.', 1));
    await expect(done).resolves.toBeUndefined();
    vi.useRealTimers();
  });

  it('allows more time for longer text and slower reading', () => {
    expect(readingTimeoutMs('A much longer sentence to read.', 0.8)).toBeGreaterThan(
      readingTimeoutMs('Short.', 1),
    );
  });
});

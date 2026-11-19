import { browserRecognition } from './speech';

interface FakeEvents {
  onspeechstart: (() => void) | null;
  onresult: ((event: { results: unknown }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

const created: (FakeEvents & { lang: string; started: boolean; aborted: boolean })[] = [];

class FakeRecognition {
  lang = '';
  continuous = true;
  interimResults = false;
  maxAlternatives = 5;
  started = false;
  aborted = false;
  onspeechstart: (() => void) | null = null;
  onresult: ((event: { results: unknown }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;

  constructor() {
    created.push(this);
  }

  start(): void {
    this.started = true;
  }

  abort(): void {
    this.aborted = true;
  }
}

function results(text: string, isFinal: boolean): unknown {
  const result = Object.assign([{ transcript: text }], { isFinal });
  return [result];
}

function handlers() {
  return {
    onSpeechStart: vi.fn(),
    onInterim: vi.fn(),
    onResult: vi.fn(),
    onNoSpeech: vi.fn(),
    onError: vi.fn(),
  };
}

function current(): FakeEvents & { lang: string; started: boolean; aborted: boolean } {
  const last = created.at(-1);
  if (last === undefined) {
    throw new Error('no recogniser was created');
  }
  return last;
}

describe('browserRecognition', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    created.length = 0;
  });

  it('is null when the browser cannot recognise speech', () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    expect(browserRecognition()).toBeNull();
  });

  it('reports speech start, interim words and the final answer in English', () => {
    vi.stubGlobal('webkitSpeechRecognition', FakeRecognition);
    const factory = browserRecognition();
    const on = handlers();
    const recognition = factory?.(on);
    recognition?.start();
    const fake = current();

    expect(fake.lang).toBe('en-US');
    expect(fake.started).toBe(true);
    fake.onspeechstart?.();
    fake.onresult?.({ results: results('I want', false) });
    fake.onresult?.({ results: results(' ', false) });
    fake.onresult?.({ results: results('I want milk', true) });
    fake.onend?.();

    expect(on.onSpeechStart).toHaveBeenCalledOnce();
    expect(on.onInterim).toHaveBeenCalledWith('I want');
    expect(on.onResult).toHaveBeenCalledWith('I want milk');
    expect(on.onNoSpeech).not.toHaveBeenCalled();
  });

  it('says when nothing was heard and passes real errors on', () => {
    vi.stubGlobal('SpeechRecognition', FakeRecognition);
    const quiet = handlers();
    browserRecognition()?.(quiet);
    current().onerror?.({ error: 'no-speech' });
    current().onend?.();
    expect(quiet.onNoSpeech).toHaveBeenCalledOnce();
    expect(quiet.onError).not.toHaveBeenCalled();

    const blocked = handlers();
    browserRecognition()?.(blocked);
    current().onerror?.({ error: 'not-allowed' });
    current().onend?.();
    expect(blocked.onError).toHaveBeenCalledWith('not-allowed');
    expect(blocked.onNoSpeech).not.toHaveBeenCalled();
  });

  it('stops without reporting anything', () => {
    vi.stubGlobal('SpeechRecognition', FakeRecognition);
    const on = handlers();
    browserRecognition()?.(on).stop();
    const fake = current();
    fake.onend?.();

    expect(fake.aborted).toBe(true);
    expect(on.onNoSpeech).not.toHaveBeenCalled();
  });
});

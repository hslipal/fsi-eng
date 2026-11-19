import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { stubFetchRoutes } from '@/test/fetchStub';
import type { SpeakingPrompt } from '../model/assessment';
import type { SubtitleLayers } from '../model/subtitles';
import { SamplePlayer } from './SamplePlayer';

const PROMPT: SpeakingPrompt = {
  key: 'dev:0:0',
  part: 1,
  question: 'Are you a polite person?',
  hasSample: true,
  sampleSeconds: 20.6,
  devOnly: true,
};

const LINES = [
  {
    start: 0,
    end: 3,
    text: 'Yes, I think I am quite polite.',
    translation: '是的，我觉得我挺有礼貌的。',
  },
  { start: 3, end: 7, text: 'I always say thank you.', translation: null },
];

function Player(): ReactElement {
  const [layers, setLayers] = useState<SubtitleLayers>({ english: true, chinese: true });
  return <SamplePlayer prompt={PROMPT} layers={layers} onLayers={setLayers} />;
}

function audio(): HTMLAudioElement {
  const element = screen.getByLabelText('示范回答');
  if (!(element instanceof HTMLAudioElement)) {
    throw new Error('no audio element');
  }
  return element;
}

describe('SamplePlayer', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows English and Chinese subtitles and hides each layer on click', async () => {
    stubFetchRoutes((url) =>
      url === '/api/content/speaking-prompts/dev%3A0%3A0/subtitles'
        ? { status: 200, body: { lines: LINES } }
        : { status: 404, body: {} },
    );
    const user = userEvent.setup();
    render(<Player />);

    const list = await screen.findByRole('list', { name: '字幕' });
    expect(within(list).getByText('Yes, I think I am quite polite.')).toBeInTheDocument();
    expect(within(list).getByText('是的，我觉得我挺有礼貌的。')).toBeInTheDocument();
    expect(within(list).getByText('（这一句还没有翻译）')).toBeInTheDocument();

    const english = screen.getByRole('button', { name: '英文字幕' });
    const chinese = screen.getByRole('button', { name: '中文翻译' });
    await user.click(chinese);
    expect(chinese).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText('是的，我觉得我挺有礼貌的。')).not.toBeInTheDocument();
    expect(screen.getByText('I always say thank you.')).toBeInTheDocument();

    await user.click(english);
    expect(screen.getByText('字幕已隐藏，点上面的按钮显示。')).toBeInTheDocument();
    await user.click(chinese);
    expect(screen.getByText('是的，我觉得我挺有礼貌的。')).toBeInTheDocument();
    expect(screen.queryByText('Yes, I think I am quite polite.')).not.toBeInTheDocument();
  });

  it('highlights the line being spoken and jumps to a line when clicked', async () => {
    stubFetchRoutes(() => ({ status: 200, body: { lines: LINES } }));
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<Player />);
    const list = await screen.findByRole('list', { name: '字幕' });
    const [first, second] = within(list).getAllByRole('listitem');

    let time = 4;
    Object.defineProperty(audio(), 'currentTime', {
      configurable: true,
      get: () => time,
      set: (value: number) => {
        time = value;
      },
    });
    fireEvent.timeUpdate(audio());
    expect(second).toHaveAttribute('aria-current', 'true');
    expect(first).not.toHaveAttribute('aria-current');

    await user.click(within(list).getByText('Yes, I think I am quite polite.'));
    expect(time).toBe(0);
    expect(play).toHaveBeenCalledOnce();
  });

  it('says when a sample has no subtitles yet or they cannot be loaded', async () => {
    stubFetchRoutes(() => ({ status: 404, body: {} }));
    const { unmount } = render(<Player />);
    expect(await screen.findByText('这段示范回答还没有字幕。')).toBeInTheDocument();
    unmount();

    stubFetchRoutes(() => ({ status: 500, body: {} }));
    render(<Player />);
    expect(await screen.findByText(/字幕加载失败/)).toBeInTheDocument();
  });
});

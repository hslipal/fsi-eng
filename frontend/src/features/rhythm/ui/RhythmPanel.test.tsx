import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stubFetchRoutes } from '@/test/fetchStub';
import { fakeSpeech, routeRhythmApi as route, type Posted } from '@/test/rhythmFakes';
import type { RecognitionFactory } from '../model/speech';
import { RhythmPanel } from './RhythmPanel';

function setup(recognition: RecognitionFactory | null) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
  render(<RhythmPanel recognition={recognition} />);
  return user;
}

async function openLesson(
  user: ReturnType<typeof userEvent.setup>,
  repetitions = '5',
): Promise<void> {
  await user.selectOptions(screen.getByLabelText('每种练习'), `${repetitions} 次`);
  await user.selectOptions(screen.getByLabelText('翻页'), '点「下一题」翻页');
  await user.click(await screen.findByRole('button', { name: '开始练习：Things I want' }));
  await user.click(await screen.findByRole('button', { name: '开始替换练习' }));
}

function say(speech: ReturnType<typeof fakeSpeech>, text: string): void {
  act(() => {
    const handlers = speech.live();
    handlers.onSpeechStart();
    handlers.onInterim(text.split(' ')[0] ?? text);
    handlers.onResult(text);
  });
}

describe('RhythmPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('lists the lessons of a track with their drills', async () => {
    route([]);
    const user = setup(fakeSpeech().factory);

    expect(await screen.findByText('替换练习 1 题，扩展练习 1 题')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'IT 职场英语' }));
    expect(await screen.findByText('这个赛道还没有可以练的句型。')).toBeInTheDocument();
  });

  it('introduces the drill, then grades a fast spoken answer and moves on by itself', async () => {
    const posted: Posted[] = [];
    route(posted);
    const speech = fakeSpeech();
    const user = setup(speech.factory);
    await user.selectOptions(screen.getByLabelText('每种练习'), '5 次');
    await user.click(await screen.findByRole('button', { name: '开始练习：Things I want' }));

    expect(await screen.findByRole('heading', { name: '替换练习：5 次' })).toBeInTheDocument();
    expect(screen.getByText('基础句型：I want water.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '开始替换练习' }));

    expect(screen.getByText('替换练习 第 1/5 次')).toBeInTheDocument();
    expect(screen.getByText('milk')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('正在听');
    say(speech, 'I want milk');

    await vi.waitFor(() => {
      expect(posted).toHaveLength(1);
    });
    expect(posted).toEqual([{ cardKey: 'k:0:0', answer: 'I want milk', slow: false }]);
    await vi.waitFor(() => {
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.getByText('替换练习 第 2/5 次')).toBeInTheDocument();
    });
  });

  it('tells the learner to hurry and reports a late answer as slow', async () => {
    const posted: Posted[] = [];
    route(posted);
    const speech = fakeSpeech();
    const user = setup(speech.factory);
    await user.selectOptions(screen.getByLabelText('限时'), '3 秒内开口');
    await openLesson(user);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(screen.getByRole('alert')).toHaveTextContent('加快速度！要在 3 秒内开口。');
    say(speech, 'I want tea');

    expect(await screen.findByText('不对，但超过了 3 秒')).toBeInTheDocument();
    expect(screen.getByText('参考答案：I want milk.')).toBeInTheDocument();
    expect(posted).toEqual([{ cardKey: 'k:0:0', answer: 'I want tea', slow: true }]);
  });

  it('listens again when nothing was heard', async () => {
    route([]);
    const speech = fakeSpeech();
    const user = setup(speech.factory);
    await openLesson(user);

    act(() => {
      speech.live().onNoSpeech();
    });
    expect(screen.getByText('没听到声音。')).toBeInTheDocument();
    const before = speech.listeners.length;
    await user.click(screen.getByRole('button', { name: '再说一次' }));

    expect(speech.listeners).toHaveLength(before + 1);
    expect(screen.getByRole('status')).toHaveTextContent('正在听');
  });

  it('switches to typing when the microphone is blocked', async () => {
    const posted: Posted[] = [];
    route(posted);
    const speech = fakeSpeech();
    const user = setup(speech.factory);
    await openLesson(user);

    act(() => {
      speech.live().onError('not-allowed');
    });
    expect(screen.getByRole('alert')).toHaveTextContent('无法使用麦克风，已改为打字作答');
    await user.type(screen.getByLabelText('你的答案（回车提交）'), 'I want milk{Enter}');

    expect(await screen.findByText('正确')).toBeInTheDocument();
    expect(posted).toHaveLength(1);
  });

  it('treats other recognition errors as nothing heard', async () => {
    route([]);
    const speech = fakeSpeech();
    const user = setup(speech.factory);
    await openLesson(user);

    act(() => {
      speech.live().onError('network');
    });
    expect(screen.getByText('没听到声音。')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '改为打字' }));
    expect(screen.getByLabelText('你的答案（回车提交）')).toBeInTheDocument();
  });

  it('waits for the learner in manual mode and can switch to automatic', async () => {
    route([]);
    const speech = fakeSpeech();
    const user = setup(speech.factory);
    await openLesson(user);
    say(speech, 'I want milk');
    await screen.findByText('正确');

    expect(screen.getByText('你的回答：I want milk')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('替换练习 第 1/5 次')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '下一题' }));
    expect(screen.getByText('替换练习 第 2/5 次')).toBeInTheDocument();
    say(speech, 'I want milk');
    await screen.findByText('正确');
    await user.click(screen.getByRole('button', { name: '改为自动翻页' }));
    act(() => {
      vi.advanceTimersByTime(1300);
    });
    expect(await screen.findByText('替换练习 第 3/5 次')).toBeInTheDocument();
  });

  it('goes from substitution to the chained expansion drill and ends with a summary', async () => {
    route([]);
    const user = setup(null);
    expect(screen.getByLabelText('作答方式')).toHaveValue('typing');
    expect(screen.getByText(/这个浏览器不支持语音识别/)).toBeInTheDocument();
    await openLesson(user);

    for (let turn = 0; turn < 5; turn++) {
      await user.type(screen.getByLabelText('你的答案（回车提交）'), 'I want milk{Enter}');
      await screen.findByText('正确');
      await user.click(screen.getByRole('button', { name: '下一题' }));
    }

    expect(screen.getByRole('heading', { name: '扩展练习：5 次' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '开始扩展练习' }));
    expect(screen.getByText("上一句：There's a cup on the table.")).toBeInTheDocument();
    for (let turn = 0; turn < 5; turn++) {
      await user.type(screen.getByLabelText('你的答案（回车提交）'), 'a spoon{Enter}');
      await screen.findByText('不对');
      await user.click(screen.getByRole('button', { name: '下一题' }));
    }

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    expect(rows[1]).toHaveTextContent('替换练习55000');
    expect(rows[2]).toHaveTextContent('扩展练习50050');
    await user.click(screen.getByRole('button', { name: '退出这一课' }));
    expect(await screen.findByText('替换练习 1 题，扩展练习 1 题')).toBeInTheDocument();
  });

  it('shows why a lesson or a grade failed', async () => {
    stubFetchRoutes((url) =>
      url.startsWith('/api/practice/lessons?')
        ? {
            status: 200,
            body: [{ id: 'gone', title: 'Gone', level: 'ILR 1', steps: [] }],
          }
        : { status: 404, body: {} },
    );
    const user = setup(null);
    await user.click(await screen.findByRole('button', { name: '开始练习：Gone' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('这一课已经不存在了');
  });

  it('says the backend needs a restart when it has no lesson list', async () => {
    stubFetchRoutes(() => ({ status: 404, body: {} }));
    setup(null);

    expect(await screen.findByRole('alert')).toHaveTextContent('docker compose restart backend');
  });

  it('labels lessons built from development material', async () => {
    stubFetchRoutes((url) =>
      url.startsWith('/api/practice/lessons?')
        ? {
            status: 200,
            body: [
              {
                id: 'book',
                title: 'Letters from a book',
                level: 'ILR 2',
                steps: [{ type: 'substitution', count: 20 }],
                devOnly: true,
              },
            ],
          }
        : {
            status: 200,
            body: {
              id: 'book',
              title: 'Letters from a book',
              level: 'ILR 2',
              cards: [],
              devOnly: true,
            },
          },
    );
    const user = setup(null);

    expect(await screen.findByText('开发素材')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '开始练习：Letters from a book' }));
    expect(await screen.findByRole('note')).toHaveTextContent('仅限开发环境');
  });

  it('shows when the lessons cannot be loaded', async () => {
    stubFetchRoutes(() => ({ status: 500, body: {} }));
    setup(null);

    expect(await screen.findByRole('alert')).toHaveTextContent('课程加载失败');
  });
});

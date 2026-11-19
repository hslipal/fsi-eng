import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stubFetchRoutes } from '@/test/fetchStub';
import { fakeSpeaker, routeRhythmApi as route, type Posted } from '@/test/rhythmFakes';
import type { Speaker } from '../model/voice';
import { RhythmPanel } from './RhythmPanel';

type User = ReturnType<typeof userEvent.setup>;

function setup(speaker: Speaker | null): User {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
  render(<RhythmPanel makeSpeaker={() => speaker} />);
  return user;
}

async function openLesson(user: User, mode: 'tape' | 'typing' = 'tape'): Promise<void> {
  await user.selectOptions(screen.getByLabelText('每种练习'), '5 次');
  if (mode === 'typing') {
    await user.selectOptions(screen.getByLabelText('作答方式'), '打字，自动判分');
    await user.selectOptions(screen.getByLabelText('翻页'), '点「下一题」翻页');
  }
  await user.click(await screen.findByRole('button', { name: '开始练习：Things I want' }));
  await user.click(await screen.findByRole('button', { name: '开始替换练习' }));
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
    const user = setup(fakeSpeaker().speaker);

    expect(await screen.findByText('替换练习 1 题，扩展练习 1 题')).toBeInTheDocument();
    expect(screen.getByText(/提示和标准答案由浏览器朗读/)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'IT 职场英语' }));
    expect(await screen.findByText('这个赛道还没有可以练的句型。')).toBeInTheDocument();
  });

  it('reads the cue, reveals and reads the model answer, and saves the self-grade', async () => {
    const posted: Posted[] = [];
    route(posted);
    const voice = fakeSpeaker();
    const user = setup(voice.speaker);
    await user.selectOptions(screen.getByLabelText('每种练习'), '5 次');
    await user.click(await screen.findByRole('button', { name: '开始练习：Things I want' }));

    expect(await screen.findByRole('heading', { name: '替换练习：5 次' })).toBeInTheDocument();
    expect(screen.getByText('基础句型：I want water.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '开始替换练习' }));

    expect(screen.getByText('替换练习 第 1/5 次')).toBeInTheDocument();
    expect(await screen.findByText('大声说出整句')).toBeInTheDocument();
    expect(voice.spoken).toEqual(['milk']);
    await user.keyboard(' ');

    expect(screen.getByText('I want milk.')).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(voice.spoken).toEqual(['milk', 'I want milk.']);
    });
    await user.keyboard('r');
    await vi.waitFor(() => {
      expect(voice.spoken).toHaveLength(3);
    });
    await user.keyboard('1');

    expect(await screen.findByText('替换练习 第 2/5 次')).toBeInTheDocument();
    expect(posted).toEqual([{ cardKey: 'k:0:0', answer: '', slow: false, verdict: 'correct' }]);
  });

  it('reveals the answer when the pause runs out and saves it as slow', async () => {
    const posted: Posted[] = [];
    route(posted);
    const user = setup(fakeSpeaker().speaker);
    await user.selectOptions(screen.getByLabelText('停顿'), '3 秒');
    await openLesson(user);
    await screen.findByText('大声说出整句');

    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(screen.getByRole('alert')).toHaveTextContent('3 秒到了，加快速度！');
    await user.click(screen.getByRole('button', { name: '3 没说对' }));

    await screen.findByText('替换练习 第 2/5 次');
    expect(posted).toEqual([{ cardKey: 'k:0:0', answer: '', slow: true, verdict: 'wrong' }]);
  });

  it('works without speech, and runs from substitution to the chained expansion and a summary', async () => {
    route([]);
    const user = setup(null);
    expect(screen.getByText(/这个浏览器不能朗读/)).toBeInTheDocument();
    await openLesson(user);

    for (let turn = 0; turn < 5; turn++) {
      await user.click(await screen.findByRole('button', { name: '说完了（空格键）' }));
      await user.click(screen.getByRole('button', { name: '1 说对了' }));
    }
    expect(await screen.findByRole('heading', { name: '扩展练习：5 次' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '开始扩展练习' }));
    expect(screen.getByText("上一句：There's a cup on the table.")).toBeInTheDocument();
    for (let turn = 0; turn < 5; turn++) {
      await screen.findByText('大声说出整句');
      await user.keyboard('{Enter}');
      await user.keyboard('2');
    }

    const rows = within(await screen.findByRole('table')).getAllByRole('row');
    expect(rows[1]).toHaveTextContent(/^替换练习55000/);
    expect(rows[2]).toHaveTextContent(/^扩展练习50500/);
    await user.click(screen.getByRole('button', { name: '退出这一课' }));
    expect(await screen.findByText('替换练习 1 题，扩展练习 1 题')).toBeInTheDocument();
  });

  it('grades typed answers, reminds a slow typist and moves on when asked', async () => {
    const posted: Posted[] = [];
    route(posted);
    const user = setup(fakeSpeaker().speaker);
    await openLesson(user, 'typing');
    const input = await screen.findByLabelText('你的答案（回车提交）');

    act(() => {
      vi.advanceTimersByTime(5100);
    });
    expect(screen.getByRole('alert')).toHaveTextContent('加快速度！要在 5 秒内开始作答。');
    await user.type(input, 'I want tea{Enter}');

    expect(await screen.findByText('不对，但超过了 5 秒')).toBeInTheDocument();
    expect(screen.getByText('参考答案：I want milk.')).toBeInTheDocument();
    expect(posted).toEqual([{ cardKey: 'k:0:0', answer: 'I want tea', slow: true }]);
    await user.click(screen.getByRole('button', { name: '下一题' }));
    await user.type(await screen.findByLabelText('你的答案（回车提交）'), 'I want milk{Enter}');
    expect(await screen.findByText('正确')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '改为自动翻页' }));
    await vi.waitFor(() => {
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.getByText('替换练习 第 3/5 次')).toBeInTheDocument();
    });
  });

  it('shows when a self-grade cannot be saved', async () => {
    stubFetchRoutes((url) => {
      if (url.startsWith('/api/practice/lessons?')) {
        return {
          status: 200,
          body: [
            { id: 'l', title: 'One', level: 'ILR 1', steps: [{ type: 'response', count: 1 }] },
          ],
        };
      }
      if (url === '/api/practice/lessons/l') {
        return {
          status: 200,
          body: {
            id: 'l',
            title: 'One',
            level: 'ILR 1',
            cards: [
              {
                cardKey: 'k',
                type: 'response',
                instruction: 'Respond.',
                model: null,
                cue: 'Say hi.',
                base: null,
                answer: 'Hi.',
              },
            ],
          },
        };
      }
      return { status: 500, body: {} };
    });
    const user = setup(null);
    await user.click(await screen.findByRole('button', { name: '开始练习：One' }));
    await user.click(await screen.findByRole('button', { name: '开始回应练习' }));
    await user.keyboard(' ');
    await user.keyboard('1');

    expect(await screen.findByRole('alert')).toHaveTextContent('保存失败');
  });

  it('shows why a lesson failed', async () => {
    stubFetchRoutes((url) =>
      url.startsWith('/api/practice/lessons?')
        ? { status: 200, body: [{ id: 'gone', title: 'Gone', level: 'ILR 1', steps: [] }] }
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
                title: 'Letters',
                level: 'ILR 2',
                steps: [{ type: 'substitution', count: 20 }],
                devOnly: true,
              },
            ],
          }
        : {
            status: 200,
            body: { id: 'book', title: 'Letters', level: 'ILR 2', cards: [], devOnly: true },
          },
    );
    const user = setup(null);

    expect(await screen.findByText('开发素材')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '开始练习：Letters' }));
    expect(await screen.findByRole('note')).toHaveTextContent('仅限开发环境');
  });

  it('shows when the lessons cannot be loaded', async () => {
    stubFetchRoutes(() => ({ status: 500, body: {} }));
    setup(null);

    expect(await screen.findByRole('alert')).toHaveTextContent('后端没有响应，可能还在启动');
  });

  it('says the backend is not answering when the network fails', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));
    setup(null);

    expect(await screen.findByRole('alert')).toHaveTextContent('后端没有响应');
  });

  it('passes other errors on as they are', async () => {
    stubFetchRoutes(() => ({ status: 400, body: {} }));
    setup(null);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'GET /api/practice/lessons?track=business failed',
    );
  });
});

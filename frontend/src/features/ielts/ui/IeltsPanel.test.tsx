import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stubFetch, stubFetchRoutes } from '@/test/fetchStub';
import { IeltsPanel } from './IeltsPanel';

const writingScore = {
  estimated: true,
  disclaimer: 'AI 估计分数，仅供练习参考，不等同于雅思官方考官评分。',
  skill: 'writing',
  overallBand: 6,
  criteria: [
    { criterion: 'task-response', band: 6, comment: '论点需要例子。' },
    { criterion: 'coherence-cohesion', band: 6.5, comment: '段落清楚。' },
    { criterion: 'lexical-resource', band: 6, comment: '用词重复。' },
    { criterion: 'grammatical-range-accuracy', band: 5.5, comment: '主谓一致。' },
  ],
  summary: '先补充论据。',
  pronunciationScored: false,
  transcript: null,
};

const speakingScore = {
  ...writingScore,
  skill: 'speaking',
  criteria: [
    { criterion: 'fluency-coherence', band: 6, comment: '偏短。' },
    { criterion: 'lexical-resource', band: 6.5, comment: '恰当。' },
    { criterion: 'grammatical-range-accuracy', band: 6, comment: '基本正确。' },
  ],
  transcript: 'I prefer working from home.',
};

describe('IeltsPanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('scores an essay and always labels the result as an estimate', async () => {
    const fetchMock = stubFetch(200, writingScore);
    const user = userEvent.setup();
    render(<IeltsPanel />);

    const submit = screen.getByRole('button', { name: '估分' });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText('你的作文'), 'word '.repeat(25));
    expect(screen.getByText('已写 25 词（建议至少 250 词）')).toBeInTheDocument();
    await user.click(submit);

    expect(await screen.findByRole('heading', { name: 'AI 估计分数（非官方）' })).toBeVisible();
    expect(screen.getByText('估计总分：6.0')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: '语法多样性与准确性' })).toHaveAttribute(
      'aria-valuenow',
      '5.5',
    );
    expect(screen.getByText('主谓一致。')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('不等同于雅思官方考官评分');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/assessment/writing',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('switches prompts and shows the Task 1 word target', async () => {
    const user = userEvent.setup();
    render(<IeltsPanel />);

    await user.selectOptions(screen.getByLabelText('题目'), 'phone-ownership');

    expect(screen.getByText('已写 0 词（建议至少 150 词）')).toBeInTheDocument();
  });

  const prompts = [
    {
      key: 'dev:0:0',
      part: 1,
      question: 'Do you like your job?',
      hasSample: true,
      sampleSeconds: 16.2,
      devOnly: true,
    },
    {
      key: 'dev:0:1',
      part: 2,
      question: 'Describe a natural place',
      hasSample: false,
      sampleSeconds: null,
      devOnly: false,
    },
  ];

  it('scores a speaking recording and says pronunciation was not scored', async () => {
    const sent: { url: string; init: RequestInit | undefined }[] = [];
    stubFetchRoutes((url, init) => {
      sent.push({ url, init });
      return url === '/api/content/speaking-prompts'
        ? { status: 200, body: prompts }
        : { status: 200, body: speakingScore };
    });
    const user = userEvent.setup();
    render(<IeltsPanel />);

    await user.click(screen.getByRole('tab', { name: '口语' }));
    expect(await screen.findByRole('note')).toHaveTextContent('仅限开发环境使用');
    expect(screen.getByLabelText('示范回答')).toHaveAttribute(
      'src',
      '/api/content/speaking-prompts/dev%3A0%3A0/sample',
    );
    expect(screen.getByText('示范回答（16 秒）')).toBeInTheDocument();
    await user.upload(
      screen.getByLabelText('你的录音（最长 2 分钟、8 MB 以内）'),
      new File([new Uint8Array([1, 2, 3])], 'answer.webm', { type: 'audio/webm' }),
    );
    await user.click(screen.getByRole('button', { name: '估分' }));

    expect(await screen.findByText('语音转文字无法判断发音。')).toBeInTheDocument();
    expect(screen.getByText('未评分')).toBeInTheDocument();
    expect(screen.queryByRole('meter', { name: '发音' })).not.toBeInTheDocument();
    expect(screen.getByText('识别出的回答：I prefer working from home.')).toBeInTheDocument();
    const upload = sent.at(-1);
    expect(upload?.url).toBe('/api/assessment/speaking');
    const form = upload?.init?.body;
    expect(form).toBeInstanceOf(FormData);
    if (form instanceof FormData) {
      expect(form.get('part')).toBe('1');
      expect(form.get('question')).toBe('Do you like your job?');
    }
  });

  it('switches to Part 2 questions, which have no sample here', async () => {
    stubFetchRoutes(() => ({ status: 200, body: prompts }));
    const user = userEvent.setup();
    render(<IeltsPanel />);

    await user.click(screen.getByRole('tab', { name: '口语' }));
    await user.selectOptions(await screen.findByLabelText('部分'), '2');

    expect(screen.getByRole('option', { name: 'Describe a natural place' })).toBeInTheDocument();
    expect(screen.queryByLabelText('示范回答')).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('部分'), '3');
    expect(screen.getByText('这个部分没有题目。')).toBeInTheDocument();
  });

  it('says when there are no speaking questions or they cannot be loaded', async () => {
    stubFetchRoutes(() => ({ status: 200, body: [] }));
    const user = userEvent.setup();
    const { unmount } = render(<IeltsPanel />);
    await user.click(screen.getByRole('tab', { name: '口语' }));
    expect(await screen.findByText('还没有可用的口语题目。')).toBeInTheDocument();
    unmount();

    stubFetchRoutes(() => ({ status: 500, body: {} }));
    render(<IeltsPanel />);
    await user.click(screen.getByRole('tab', { name: '口语' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('口语题目加载失败');
  });

  it('explains when AI scoring is unavailable', async () => {
    stubFetch(503, {});
    const user = userEvent.setup();
    render(<IeltsPanel />);

    await user.type(screen.getByLabelText('你的作文'), 'word '.repeat(25));
    await user.click(screen.getByRole('button', { name: '估分' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('AI 评分暂时不可用');
  });

  it('shows other failures as they are', async () => {
    stubFetch(500, {});
    const user = userEvent.setup();
    render(<IeltsPanel />);

    await user.type(screen.getByLabelText('你的作文'), 'word '.repeat(25));
    await user.click(screen.getByRole('button', { name: '估分' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'POST /api/assessment/writing failed',
    );
  });
});

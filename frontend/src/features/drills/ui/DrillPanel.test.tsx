import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stubFetchRoutes } from '@/test/fetchStub';
import { DrillPanel } from './DrillPanel';

function card(index: number): Record<string, unknown> {
  return {
    cardKey: `content:0:${String(index)}`,
    title: 'Requesting a quote',
    type: 'substitution',
    instruction: 'Replace the document.',
    model: 'Could you send me the quote by Friday?',
    passage: null,
    cue: index === 0 ? 'contract' : 'invoice',
    options: [],
  };
}

const correct = {
  verdict: 'correct',
  expected: 'Could you send me the contract by Friday?',
  box: 1,
  nextReviewAt: '2026-11-20T00:00:00Z',
};

interface Reply {
  readonly status: number;
  readonly body: unknown;
}

function stubPractice(cards: unknown[], answer: Reply = { status: 200, body: correct }) {
  return stubFetchRoutes((url) =>
    url.startsWith('/api/practice/cards') ? { status: 200, body: cards } : answer,
  );
}

describe('DrillPanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('walks through the cards: answer, feedback, next, done', async () => {
    const fetchMock = stubPractice([card(0), card(1)]);
    const user = userEvent.setup();
    render(<DrillPanel />);

    expect(await screen.findByText('contract')).toBeInTheDocument();
    expect(screen.getByText('第 1/2 题')).toBeInTheDocument();
    expect(screen.getByText('例句：Could you send me the quote by Friday?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '提交' })).toBeDisabled();

    await user.type(screen.getByLabelText('你的答案'), 'Could you send me the contract by Friday?');
    await user.click(screen.getByRole('button', { name: '提交' }));

    expect(await screen.findByText('正确')).toBeInTheDocument();
    expect(
      screen.getByText('参考答案：Could you send me the contract by Friday?'),
    ).toBeInTheDocument();
    expect(screen.getByText('记忆盒 1/5')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/practice/answers',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          cardKey: 'content:0:0',
          answer: 'Could you send me the contract by Friday?',
        }),
      }),
    );

    await user.click(screen.getByRole('button', { name: '下一题' }));
    expect(screen.getByText('invoice')).toBeInTheDocument();
    expect(screen.getByLabelText('你的答案')).toHaveValue('');

    await user.type(screen.getByLabelText('你的答案'), 'x');
    await user.click(screen.getByRole('button', { name: '提交' }));
    await user.click(await screen.findByRole('button', { name: '下一题' }));
    expect(screen.getByText('本轮练习完成，共 2 题。')).toBeInTheDocument();
  });

  it('says when a track has nothing to practise and reloads on track switch', async () => {
    const fetchMock = stubPractice([]);
    const user = userEvent.setup();
    render(<DrillPanel />);

    expect(await screen.findByText('这个赛道现在没有要练的题。')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'IT 职场英语' }));

    expect(await screen.findByText('这个赛道现在没有要练的题。')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/practice/cards?track=it',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('shows an error when the cards cannot be loaded', async () => {
    stubFetchRoutes(() => ({ status: 503, body: {} }));
    render(<DrillPanel />);

    expect(await screen.findByRole('alert')).toHaveTextContent('出错了');
  });

  it('shows an error when an answer cannot be sent', async () => {
    stubPractice([card(0)], { status: 500, body: {} });
    const user = userEvent.setup();
    render(<DrillPanel />);

    await user.type(await screen.findByLabelText('你的答案'), 'anything');
    await user.click(screen.getByRole('button', { name: '提交' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('出错了');
  });

  it('shows the passage and lets the learner pick an option for reading questions', async () => {
    const reading = {
      cardKey: 'gardens:0:0',
      title: 'Rooftop gardens',
      type: 'reading',
      instruction: 'TRUE, FALSE or NOT GIVEN?',
      model: null,
      passage: 'First paragraph.\n\nSecond paragraph.',
      cue: 'The first garden opened in 2010.',
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
    };
    const fetchMock = stubPractice([reading], {
      status: 200,
      body: {
        verdict: 'wrong',
        expected: 'NOT GIVEN',
        box: 0,
        nextReviewAt: '2026-11-20T00:00:00Z',
      },
    });
    const user = userEvent.setup();
    render(<DrillPanel />);

    const passage = await screen.findByRole('blockquote', { name: '阅读文章' });
    expect(passage).toHaveTextContent('Second paragraph.');
    expect(screen.queryByLabelText('你的答案')).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'FALSE' }));
    await user.click(screen.getByRole('button', { name: '提交' }));

    expect(await screen.findByText('参考答案：NOT GIVEN')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/practice/answers',
      expect.objectContaining({
        body: JSON.stringify({ cardKey: 'gardens:0:0', answer: 'FALSE' }),
      }),
    );
  });
});

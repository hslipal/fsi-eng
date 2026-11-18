import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stubFetch } from '@/test/fetchStub';
import { LibraryPanel } from './LibraryPanel';

const item = {
  id: '3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90',
  track: 'business',
  title: 'Asking for a quote by Friday',
  sourceUrl: null,
  license: 'generated',
  level: 'ILR 2',
};

describe('LibraryPanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the published items of the selected track', async () => {
    const fetchMock = stubFetch(200, [item]);
    render(<LibraryPanel />);

    expect(screen.getByRole('status')).toHaveTextContent('加载中');
    const list = await screen.findByRole('list', { name: '已发布素材' });
    expect(list).toHaveTextContent('Asking for a quote by Friday · ILR 2 · 原创生成');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/content/items?track=business',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('loads the other track when its tab is clicked', async () => {
    const fetchMock = stubFetch(200, []);
    render(<LibraryPanel />);
    await screen.findByText('这个赛道还没有已发布的素材。');

    await userEvent.click(screen.getByRole('tab', { name: '雅思' }));

    expect(screen.getByRole('tab', { name: '雅思' })).toHaveAttribute('aria-selected', 'true');
    await screen.findByText('这个赛道还没有已发布的素材。');
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/content/items?track=ielts',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('shows an error when the request fails', async () => {
    stubFetch(500, {});
    render(<LibraryPanel />);
    expect(await screen.findByRole('alert')).toHaveTextContent('素材加载失败');
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stubFetch } from '@/test/fetchStub';
import { App } from './App';

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens on rhythm training and switches sections from the navigation', async () => {
    stubFetch(200, []);
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('FSI-Eng');
    expect(screen.getByRole('button', { name: '节奏训练' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(await screen.findByText('这个赛道还没有可以练的句型。')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '句型操练' }));
    expect(await screen.findByText('这个赛道现在没有要练的题。')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '素材库' }));
    expect(await screen.findByText('这个赛道还没有已发布的素材。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '素材库' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: '雅思写作与口语' }));
    expect(screen.getByRole('heading', { name: '雅思写作与口语估分' })).toBeInTheDocument();
  });
});

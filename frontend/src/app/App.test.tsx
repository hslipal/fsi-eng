import { render, screen } from '@testing-library/react';
import { stubFetch } from '@/test/fetchStub';
import { App } from './App';

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the title and the library', async () => {
    stubFetch(200, []);
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('FSI-Eng');
    expect(await screen.findByText('这个赛道还没有已发布的素材。')).toBeInTheDocument();
  });
});

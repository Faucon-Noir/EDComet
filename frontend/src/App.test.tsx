import { render, screen, waitFor } from '@testing-library/react';
import { EventEnum } from 'ed-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const { changeLanguage, getHello, getLanguage, stream } = vi.hoisted(() => ({
  changeLanguage: vi.fn(),
  getHello: vi.fn(),
  getLanguage: vi.fn(),
  stream: { lastEvent: null as unknown },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => `translated:${key}` }),
}));

vi.mock('./assets/locale/i18n', () => ({
  default: { changeLanguage },
}));

vi.mock('./pages/Pages', () => ({
  default: () => <div>Application pages</div>,
}));

vi.mock('./utils/api', () => ({
  helloApi: { getHello, getLanguage },
}));

vi.mock('./utils/stream', () => ({
  JournalStreamProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useJournalStream: () => ({ lastEvent: stream.lastEvent }),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stream.lastEvent = null;
    getHello.mockResolvedValue({ data: { lang: 'en' } });
    getLanguage.mockResolvedValue({ data: 'en' });
  });

  it('sets the title and loads the initial API language', async () => {
    render(<App />);

    expect(screen.getByText('Application pages')).toBeInTheDocument();
    expect(document.title).toBe('translated:title');
    await waitFor(() => expect(changeLanguage).toHaveBeenCalledWith('en'));
  });

  it('refreshes the language when the journal reports a file header', async () => {
    const { rerender } = render(<App />);
    await waitFor(() => expect(getHello).toHaveBeenCalledTimes(1));

    stream.lastEvent = { events: [EventEnum.FileHeader], files: [] };
    rerender(<App />);

    await waitFor(() => expect(getLanguage).toHaveBeenCalledTimes(1));
    expect(changeLanguage).toHaveBeenCalledWith('en');
  });
});
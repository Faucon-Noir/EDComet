import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HomePage from '.';

const { getMeInfo } = vi.hoisted(() => ({
  getMeInfo: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { id?: string; name?: string }) =>
      options?.name ? `${key}:${options.name}:${options.id ?? ''}` : `translated:${key}`,
  }),
}));

vi.mock('../../utils/api', () => ({
  helloApi: { getMeInfo },
}));

describe('HomePage', () => {
  it('loads and displays commander information', async () => {
    getMeInfo.mockResolvedValue({
      data: { Name: 'Cmdr Test', FID: 'F12345' },
    });

    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'translated:title' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText('welcome:Cmdr Test:')).toBeInTheDocument(),
    );
    expect(screen.getByText('cmdrInfo:Cmdr Test:F12345')).toBeInTheDocument();
    expect(document.title).toBe('translated:title');
  });
});
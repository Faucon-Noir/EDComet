import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { describe, expect, it, vi } from 'vitest';
import theme from '../../theme';
import TestPage from '.';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => `translated:${key}` }),
}));

describe('TestPage', () => {
  it('renders translated content with the application theme', () => {
    render(
      <ThemeProvider theme={theme}>
        <TestPage />
      </ThemeProvider>,
    );

    expect(screen.getByRole('heading', { name: 'translated:title' })).toBeInTheDocument();
    expect(screen.getByText('translated:title should be equal to upper h1')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'abcdefghijklmnopqrstuvwxyz' })).toBeInTheDocument();
  });
});
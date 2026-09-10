import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DisplayBox from '.';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => `translated:${key}` }),
}));

describe('DisplayBox', () => {
  it('shows the work-in-progress message when no items are provided', () => {
    render(<DisplayBox text="Construction data" />);

    expect(screen.getByText('Construction data')).toBeInTheDocument();
    expect(screen.getByText('translated:wip')).toBeInTheDocument();
  });

  it('shows provided items and the translation contribution link', () => {
    render(<DisplayBox text="Construction data" items={['Depot', 'Warehouse']} />);

    expect(screen.getByText('Depot')).toBeInTheDocument();
    expect(screen.getByText('Warehouse')).toBeInTheDocument();
    expect(screen.queryByText('translated:wip')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'translated:translate.linkText' })).toHaveAttribute(
      'href',
      'https://crowdin.com/project/ed-comet',
    );
  });
});
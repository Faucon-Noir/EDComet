import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConstructionPage from '.';

const { handleToggle, isResourceChecked, toggleResource, useConstructionPage } = vi.hoisted(
  () => ({
    handleToggle: vi.fn(),
    isResourceChecked: vi.fn(),
    toggleResource: vi.fn(),
    useConstructionPage: vi.fn(),
  }),
);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => `translated:${key}` }),
}));

vi.mock('./hook', () => ({ useConstructionPage }));

describe('ConstructionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    handleToggle.mockReturnValue(toggleResource);
    isResourceChecked.mockReturnValue(false);
    useConstructionPage.mockReturnValue({
      categorizedResources: [
        {
          key: 'metals',
          label: 'Metals',
          resources: [
            { Name: 'Steel', RequiredAmount: 10, ProvidedAmount: 4 },
            { Name: 'Aluminium', RequiredAmount: 6, ProvidedAmount: 6 },
          ],
        },
      ],
      formatResourceLabel: (resource: { Name: string }) => resource.Name,
      handleToggle,
      isResourceChecked,
      progress: 60,
      statsList: [{ label: 'stats.resourcesRequired', value: '16' }],
    });
  });

  it('renders construction progress, stats, and categorized resources', () => {
    render(<ConstructionPage />);

    expect(screen.getByRole('heading', { name: 'translated:title' })).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('translated:stats.resourcesRequired 16')).toBeInTheDocument();
    expect(screen.getByText('Metals')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Steel (6)' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Aluminium (0)' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('toggles a resource when its row is selected', () => {
    render(<ConstructionPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Steel (6)' }));

    expect(handleToggle).toHaveBeenCalledWith('Steel');
    expect(toggleResource).toHaveBeenCalledOnce();
  });
});
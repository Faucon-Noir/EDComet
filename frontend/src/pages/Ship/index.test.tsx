import { render, screen, waitFor } from '@testing-library/react';
import { EventEnum } from 'ed-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ShipPage from '.';

const { getShipLoadout, stream } = vi.hoisted(() => ({
  getShipLoadout: vi.fn(),
  stream: { lastEvent: null as unknown },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => `translated:${key}` }),
}));

vi.mock('../../utils/api', () => ({
  shipApi: { getShipLoadout },
}));

vi.mock('../../utils/stream', () => ({
  useJournalStream: () => ({ lastEvent: stream.lastEvent }),
}));

describe('ShipPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stream.lastEvent = null;
  });

  it('loads and displays the current ship loadout', async () => {
    getShipLoadout.mockResolvedValue({
      data: {
        Ship: 'CobraMkIII',
        ShipName: 'Wayfarer',
        ShipIdent: 'ED-42',
        CargoCapacity: 32,
        MaxJumpRange: 24.5,
      },
    });

    render(<ShipPage />);

    expect(screen.getByText('translated:emptyState')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText('translated:summary.name: Wayfarer')).toBeInTheDocument(),
    );
    expect(screen.getByText('translated:summary.identifier: ED-42')).toBeInTheDocument();
    expect(screen.getByText('translated:summary.cargoCapacity: 32')).toBeInTheDocument();
    expect(screen.getByText('translated:summary.jumpRange: 24.5')).toBeInTheDocument();
  });

  it('reloads the loadout when a loadout journal event arrives', async () => {
    getShipLoadout
      .mockResolvedValueOnce({
        data: { Ship: 'Sidewinder', CargoCapacity: 4, MaxJumpRange: 8 },
      })
      .mockResolvedValueOnce({
        data: { Ship: 'AspExplorer', CargoCapacity: 64, MaxJumpRange: 30 },
      });

    const { rerender } = render(<ShipPage />);
    await waitFor(() =>
      expect(screen.getByText('translated:summary.name: Sidewinder')).toBeInTheDocument(),
    );

    stream.lastEvent = { events: [EventEnum.Loadout], files: [] };
    rerender(<ShipPage />);

    await waitFor(() => expect(getShipLoadout).toHaveBeenCalledTimes(2));
    expect(screen.getByText('translated:summary.name: AspExplorer')).toBeInTheDocument();
  });
});
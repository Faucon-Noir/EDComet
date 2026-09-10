import { render, screen, waitFor } from '@testing-library/react';
import { EventEnum } from 'ed-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JournalStreamProvider, useJournalStream } from '.';

const { getJournalStreamUrl } = vi.hoisted(() => ({
  getJournalStreamUrl: vi.fn(),
}));

vi.mock('../api', () => ({ getJournalStreamUrl }));

class TestEventSource {
  static instances: TestEventSource[] = [];

  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  close = vi.fn();
  private listeners = new Map<string, EventListener>();

  constructor(readonly url: string) {
    TestEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: EventListener) {
    this.listeners.set(type, listener);
  }

  removeEventListener = vi.fn((type: string) => {
    this.listeners.delete(type);
  });

  open() {
    this.onopen?.(new Event('open'));
  }

  emitJournalUpdate(payload: unknown) {
    this.listeners.get('journal-update')?.(
      new MessageEvent('journal-update', { data: JSON.stringify(payload) }),
    );
  }
}

function StreamState() {
  const { lastEvent, status } = useJournalStream();
  return <output>{`${status}:${lastEvent?.id ?? 'none'}`}</output>;
}

describe('JournalStreamProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestEventSource.instances = [];
    getJournalStreamUrl.mockResolvedValue('/journal/stream');
    vi.stubGlobal('EventSource', TestEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('connects and exposes supported journal events to consumers', async () => {
    render(
      <JournalStreamProvider>
        <StreamState />
      </JournalStreamProvider>,
    );

    await waitFor(() => expect(TestEventSource.instances).toHaveLength(1));
    const eventSource = TestEventSource.instances[0];
    expect(eventSource.url).toBe('/journal/stream');

    eventSource.open();
    await waitFor(() => expect(screen.getByText('connected:none')).toBeInTheDocument());

    eventSource.emitJournalUpdate({
      id: 'event-42',
      events: [EventEnum.FileHeader],
      files: [],
      timestamp: '2026-09-10T12:00:00.000Z',
    });

    await waitFor(() =>
      expect(screen.getByText('connected:event-42')).toBeInTheDocument(),
    );
  });

  it('ignores journal events that are not supported by the application', async () => {
    render(
      <JournalStreamProvider>
        <StreamState />
      </JournalStreamProvider>,
    );

    await waitFor(() => expect(TestEventSource.instances).toHaveLength(1));
    TestEventSource.instances[0].emitJournalUpdate({
      id: 'unsupported-event',
      events: [EventEnum.MarketSell],
    });

    expect(screen.getByText('connecting:none')).toBeInTheDocument();
  });

  it('reports a disconnected status when the stream URL cannot be created', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    getJournalStreamUrl.mockRejectedValueOnce(new Error('Unavailable stream'));

    render(
      <JournalStreamProvider>
        <StreamState />
      </JournalStreamProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText('disconnected:none')).toBeInTheDocument(),
    );
    warning.mockRestore();
  });

  it('closes the event source when the provider unmounts', async () => {
    const { unmount } = render(
      <JournalStreamProvider>
        <StreamState />
      </JournalStreamProvider>,
    );

    await waitFor(() => expect(TestEventSource.instances).toHaveLength(1));
    const eventSource = TestEventSource.instances[0];

    unmount();

    expect(eventSource.removeEventListener).toHaveBeenCalledWith(
      'journal-update',
      expect.any(Function),
    );
    expect(eventSource.close).toHaveBeenCalledOnce();
  });
});
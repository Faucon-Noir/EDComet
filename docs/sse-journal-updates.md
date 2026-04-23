# SSE Journal Updates

## Goal

Prepare an MVP that keeps the UI in sync with Elite Dangerous journal changes without forcing the user to refresh the page manually.

## Problem Statement

EDComet already reads the latest journal file and exposes snapshot endpoints such as ship loadout and construction depot state. The missing piece is a push mechanism that tells the frontend when those snapshots changed.

Without SSE:

- the user has to refresh manually or tolerate stale data;
- the frontend does not know when a new journal line becomes relevant;
- live workflows around construction and ship state feel unreliable.

## User Story

As an EDComet user docked in game,
I want the app to refresh relevant data automatically when a new journal event is detected,
so that the ship and construction information shown in the UI stays current while I play.

## Product Decision For MVP

The SSE MVP should push event metadata only, then let the frontend re-fetch the affected REST resource.

Why this choice:

- keeps the SSE contract small and stable;
- avoids duplicating business payloads between REST and streaming;
- lets the frontend adopt SSE incrementally page by page;
- reduces regression risk while the journal watcher is still evolving.

Target event families for MVP:

- `Loadout`
- `ColonisationConstructionDepot`
- `FileHeader`

## Expected User Outcome

- When a supported journal event is appended, the UI updates automatically within a short delay.
- The user never needs to guess whether the displayed state is stale.
- If the stream disconnects, the app keeps working with the existing REST API and can recover cleanly.

## Scope

In scope for MVP:

- one backend SSE endpoint dedicated to journal updates;
- event notifications for the three currently parsed journal event types;
- frontend subscription lifecycle at app or page level;
- automatic re-fetch of impacted REST data after an SSE notification;
- basic connection states: connecting, connected, disconnected.

Out of scope for MVP:

- pushing full domain payloads in SSE;
- replay/history across reconnects;
- auth-specific stream segmentation;
- multi-user routing;
- persistence and event backlog storage.

## Acceptance Criteria

1. When the backend detects a new supported journal event, it emits one SSE message to connected clients.
2. Each SSE message includes enough metadata for the frontend to know what changed at minimum: event type and server timestamp.
3. When the frontend receives a `Loadout` event, it re-fetches the ship loadout endpoint and refreshes the visible data without a full page reload.
4. When the frontend receives a `ColonisationConstructionDepot` event, it re-fetches the construction depot data and refreshes the visible data without a full page reload.
5. When the frontend receives a `FileHeader` event, the frontend can refresh the related session or commander context without breaking the current page.
6. If the SSE connection drops, the UI exposes a non-blocking disconnected state and remains usable with the last known REST data.
7. Reconnecting to the SSE endpoint must not duplicate visible UI updates for a single incoming journal line.
8. The SSE MVP must not change the existing REST response shapes.

## Delivery Slices

### Slice 1

Backend emits normalized SSE events from the journal watcher.

### Slice 2

Frontend subscribes to SSE and logs or surfaces connection state.

### Slice 3

Frontend maps incoming event types to targeted REST re-fetch actions.

### Slice 4

UX hardening for reconnect, stale-state messaging, and basic observability.

## Open Questions

- Should the SSE connection be opened globally at app boot, or only on pages that benefit from live updates?
- Do we want a generic event name such as `journal-update`, or specific event names per journal type?
- What debounce or coalescing rule is acceptable if several journal lines arrive almost at once?
- Do we expose connection health visibly in the header, or keep it internal for the MVP?

## Ready For Tech Lead

The implementation phase can start when the Tech Lead has:

- validated the SSE endpoint contract and event envelope;
- chosen the frontend subscription placement;
- defined reconnect behavior and minimal observability;
- confirmed which existing REST endpoints are re-fetched for each supported event.

# ED COMET

This is a companion tool to simplify the colonisation building process
Dock to your Construction Site, & let the tool do its stuff. It will provide you with evverything you need to know, from a friendly list of what you need to the nearests markets were you can find what you need.
Work for every Construction Site
Markets supplies are planned to query the EDDN API, still need to discuss with them
We use the [Jixxed's Journal doc](https://jixxed.github.io/ed-journal-schemas/index.html) for types references

## Architecture

ED Comet is a `pnpm` monorepo composed of three packages:

- **`frontend`**: a Vite/React application that presents construction-site requirements, cargo information, and nearby-market results.
- **`backend`**: a TypeScript API that reads Elite Dangerous journal and game-state files, exposes domain services, and streams live journal updates to the client through Server-Sent Events (SSE).
- **`shared`**: common TypeScript types and utilities used by both the frontend and backend, including types based on Jixxed's journal schemas.

The game writes journal and state files locally. The backend turns those updates into API and SSE data for the frontend, which displays the current construction workflow. Market-supply lookups are intended to be added through the EDDN API.

## PO + Tech Lead workflow

If you need to use AI, i implemented 2 custom agents designed to work together:

- **Product Owner**: can defines user value, feature framing, prioritization, roadmap, and acceptance criteria.
- **Tech Lead**: can turns validated feature goals into architecture, implementation plan, code changes, and validation.

Recommended sequence:

1. Ask **Product Owner** to define the feature you want to work on
2. Confirm the scope and acceptance criteria.
3. Ask **Tech Lead** to produce the technical plan (and implementation if needed).

Example prompts:

- `@Product Owner Propose 3 high-impact features for EDComet, and prioritize them with ICE scoring model`
- `@Product Owner Write a user story + acceptance criteria for SSE journal updates.`
- `@Tech Lead Based on this user story, propose the implementation plan for backend + frontend.`

## ENV

You'll need 2 env file

### Frontend

```env
VITE_API_BASE_URL=
```

### Backend

```env
# SERVER
PORT="8000"

# CLIENT URL
CLIENT_URL=
API_URL=
API_PREFIX=
```

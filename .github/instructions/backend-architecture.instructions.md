---
description: "Use when working anywhere in the EDComet backend: Express bootstrap, tsoa controllers, shared contracts, journal parsing, module-level caches, file watching, SSE streaming, Jest tests, fixtures, generation scripts, and runtime configuration. Architectural analysis excludes generated artifacts and Git-ignored files."
applyTo: "backend/**"
---

# Backend Architecture and Node.js Conventions

## Scope and Ignore Rules

- These instructions apply to the entire `backend/` directory. They describe the existing architecture, not a redesign to perform during unrelated changes.
- Respect the root `.gitignore` and any applicable nested ignore files. Use Git's matching rules, including negations, rather than maintaining an independent approximation of them.
- Before exploring additional files, use `git ls-files --cached --others --exclude-standard -- backend` to identify candidates and `git check-ignore --no-index -v -- <paths>` to verify exclusions. A tracked file can still match an ignore rule; the inventory command alone does not establish architectural relevance.
- Exclude ignored content from architectural analysis: dependencies, coverage, logs, local environment files, caches, schemas, generated API directories, SBOM output, and reserved notes. Do not read local journal contents or secrets to infer coding conventions.
- The root rules specifically ignore `backend/**/routes.ts`, `backend/**/swagger.json`, `tsoa.json`, and `openapitools.json`. Their presence on disk does not make them editable source files.
- `backend/build/` is TypeScript output but is not globally ignored by the current rules: only `build/Release` is covered. Exclude compiled output explicitly rather than claiming Git already excludes it.
- Tests, fixtures, Jest configuration, and handwritten test-report helpers are included as testing architecture references. Generated coverage and reports remain excluded.
- The exception `!backend/tests/fixtures/journal/Journal*.log` explicitly re-includes journal fixtures despite the general log exclusion. These controlled fixtures are distinct from private local game journals.
- Do not create or modify tests unless explicitly requested. Do not edit generated files manually; change their source and regenerate through the existing workflow.

## Directory Ownership

| Location | Responsibility |
| --- | --- |
| `backend/src/index.ts` | Express application construction, middleware registration, generated routes, Swagger UI, startup probes, and HTTP listener |
| `backend/src/controllers/` | tsoa-decorated HTTP controllers delegating to services |
| `backend/src/services/LogInterpreterService.ts` | Current journal selection, latest-event caches, event dispatch, journal replay, and batched change notifications |
| `backend/src/services/` | Domain retrieval, fallback journal scans, market access, statistics calculations, and SSE broadcasting |
| `backend/src/utils/watcher.ts` | File polling and incremental journal reads through an `EventEmitter` |
| `backend/src/utils/utils.ts` | Platform-specific journal path resolution and language mapping |
| `backend/src/utils/type.ts` | Backend-specific event-change and SSE transport types |
| `backend/src/scripts/` | Handwritten generation entry points, coverage validation, and test-report postprocessing |
| `backend/src/theme/swagger-dark.css` | Swagger UI presentation, not application business logic |
| `backend/tests/controllers/` | Controller unit tests with mocked service dependencies |
| `backend/tests/services/` | Domain-service and interpreter/SSE tests with isolated dependencies and state |
| `backend/tests/utils/` | Utility and watcher tests, plus cross-cutting HTTP failure-mode tests |
| `backend/tests/fixtures/journal/` | Controlled journal fixtures re-included by `.gitignore` |
| `backend/jest.config.cjs`, `backend/tsconfig.test.json` | Jest discovery, TypeScript transformation, coverage, and test compilation settings |

- Domain contracts and `EventEnum` come from the `ed-shared` workspace package. Backend-local transport and watcher types remain close to their integration boundary.
- Imports are relative within the backend. Reuse existing service functions and shared contracts instead of introducing parallel repositories, client libraries, or a dependency-injection layer without a concrete need.

## Express Bootstrap and Runtime Lifecycle

- `index.ts` imports the generated `RegisterRoutes` function and Swagger document, then calls `dotenv.config()` and constructs the Express application.
- Current middleware order is `cors()`, `express.json()`, `express.urlencoded({ extended: true })`, then `RegisterRoutes(app)`. Place request-processing middleware before routes when it must affect controller requests.
- Swagger UI is mounted at `/api-docs` after generated route registration. Its custom CSS is read synchronously from `src/theme/swagger-dark.css` relative to `process.cwd()`.
- Startup probes check journal availability and the Swagger document, then `app.listen` starts the listener. The module exports the Express `app` and default-exports the listening server.
- Importing `index.ts` starts a server; importing the interpreter constructs a watcher. These modules are not side-effect-free factories. Account for resource ownership before importing them into a script or new integration.
- `PORT` currently falls back to `0`, allowing an OS-assigned port. `CLIENT_URL` appears in startup messages; it does not determine the listener's bind address.
- There is no central error-handling middleware or shutdown hook in the current bootstrap. Do not assume startup try/catch blocks cover import-time failures or provide global request error handling.
- If shutdown handling is requested, coordinate HTTP listener closure, watcher termination, batching timers, and open SSE streams. Do not add extra timers or watchers without a corresponding disposal path.

## tsoa Controllers and HTTP Contracts

- Controller files follow `*Controller.ts`, which is the discovery pattern configured by the handwritten generation script. New endpoint owners must follow that pattern to participate in generation.
- Controllers use class and method decorators such as `@Route`, `@Tags`, and `@Get`. Keep route metadata and explicit return types on the controller methods; do not hand-register an equivalent Express route elsewhere.
- Data controllers are thin adapters: delegate to the domain service rather than parsing journals, reading support files, or computing statistics inside request handlers.
- Use existing `ed-shared` domain types for response contracts. Typical retrieval methods return `Promise<DomainType | null>`; missing data currently produces a nullable response rather than an explicitly declared `404`.
- Preserve status-code and nullability semantics unless the requested change explicitly revises the HTTP contract. Do not assume every controller declares `@Response`, `@SuccessResponse`, authentication, or authorization metadata.
- `HelloController` owns basic information, commander data, and language access. Its logging-only mutation handlers are scaffolding, not a reference for domain commands.
- `SseController` is a streaming specialization: it extends tsoa `Controller`, takes the request through `@Request`, declares `@Produces('text/event-stream')`, sets streaming headers, and returns a Node.js readable stream.
- Controller route segments combine with the generated API prefix. Avoid hardcoding `/api` into every decorator or confusing the Swagger UI path with the domain API base path.

## Domain Services and Cache-First Retrieval

- Latest domain state is stored in module-level variables in `LogInterpreterService`, not per-request controller instances or a database. Do not create competing caches for the same event in another service.
- Ship, Mission, Colonisation, and latest-statistics retrieval generally follow a cache-first pattern: read the interpreter cache, scan the current journal if absent, retain the last matching event, update the shared cache, and return the result or `null`.
- Use `getCurrentJournalLines()` for the selected journal and `getLogsPath()` for support-file access. Keep path resolution and current-journal selection centralized.
- Journal content is newline-delimited JSON. Parse each line independently inside a try/catch so a malformed entry does not discard subsequent valid events.
- Prefer `unknown` for caught errors and use `getErrorMessage` from `ed-shared` when reporting them. Existing `any` catches and inconsistent logging are variations, not requirements to reproduce.
- `MarketService` is a distinct source adapter: it reads `Market.json` and checks the event and item structure. Market-purchase retrieval scans journal events rather than using a latest-event snapshot.
- `StatsService` also owns construction business calculations. It combines depot, loadout, and market purchases; missing required state or nonpositive cargo capacity can yield `null`. Keep this computation out of controllers and transport code.
- TypeScript assertions on parsed JSON do not perform runtime validation. Preserve existing shape guards and add appropriate checks when a new external field influences calculations or state transitions.
- Maintain the existing distinction between no available domain data (`null`), malformed individual entries (log and continue), and failures in file access or journal selection. Error handling is not uniform across all services.

## Journal Interpretation and Invalidation

- `cacheRelevantEvent` is the interpreter's dispatch point. It recognizes shared `EventEnum` values, updates corresponding latest-event caches, and records relevant changes for subscribers.
- The current caches cover loadout, construction depot, file header, commander, market, statistics, and missions. A market purchase records an invalidation event without becoming a latest-purchase cache.
- When adding support for a journal event, keep its shared contract, cache getter/setter when needed, dispatcher branch, change notification, and domain retrieval consistent. Not every event requires a cache.
- A `journal-switched` file change resets the domain caches and replays the newly selected journal. Preserve this reset/replay boundary so state from a previous journal does not leak into the new one.
- Changes to the `Market.json` support file invalidate the cached market before recording the file-change notification.
- Pending event names use a `Set`; summaries and file-change descriptors use maps. A 500 ms interval flushes accumulated changes to subscribers. This is coalescing, not durable event storage or delivery of every original journal line.
- `onJournalUpdate` and `onJournalFileChange` register callbacks without an unsubscribe contract. Avoid subscribing per HTTP request; long-lived service subscriptions are the current model.
- The watcher and batching interval have process-level lifetime. `stopWatching()` closes the watcher and clears the batch interval, but the current bootstrap does not call it on shutdown.

## File Watching and Platform Boundaries

- `LogFileWatcher` extends Node.js `EventEmitter` and polls every 1000 ms. It emits journal `line` events and structured `file-change` events.
- Journal reads track the previous file size and consume appended bytes. Keep incremental reading in the watcher rather than rescanning the entire file on every polling cycle.
- Journal selection uses `Journal.*.log` filenames sorted by their timestamp segment. A new selected journal triggers `journal-switched`; support-file changes use creation/update descriptors.
- `getLogsPath()` considers `ED_JOURNAL_PATH`, the Windows Saved Games location, and supported Steam/Proton locations on Linux. Preserve platform fallback behavior instead of hardcoding a developer's directory.
- `getLatestLogFile()` can throw when the path is unavailable or no journal exists. Do not promise import-safe behavior without verifying watcher initialization and its callers; development machines may have no Elite Dangerous installation.
- Language mapping converts known game-language values to supported locale codes and otherwise falls back to English. Reuse this mapping instead of duplicating it in controllers.
- Interpreter, watcher, and path utilities currently have circular dependencies. Keep changes local and avoid adding import-time access to partially initialized exports; do not expand those cycles with additional singleton state.

## Server-Sent Events and Stream Disposal

- `journalSseService` is a singleton subscribed to interpreter notifications. Keep the stream as an invalidation channel: clients refetch domain data through HTTP endpoints.
- The controller route is `journal/stream` under the configured API prefix. Do not confuse this decorator path with the final externally configured URL.
- Each subscription receives a `PassThrough`, an SSE retry directive of 5000 ms, and a 30-second comment heartbeat. A set tracks active client streams.
- Frames contain an incrementing `id`, `event: journal-update`, and JSON `data` with `id`, `events`, `files`, and `timestamp`. Keep this shape compatible with frontend consumers; summaries are not full domain payloads.
- Filter broadcast event names through the shared enum validation. The service skips a notification only when it contains neither valid events nor file changes.
- SSE headers include `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, and `Connection: keep-alive`. Keep heartbeats and framing at the streaming-service boundary.
- The controller destroys its stream when the request closes. Service cleanup removes the client and clears its heartbeat; broadcasting also drops destroyed or ended streams. Preserve all disposal paths.
- Event IDs are process-local counters. There is no replay buffer or `Last-Event-ID` recovery contract; do not present the stream as a reliable event log.
- Backend file-only invalidations and frontend event filtering are separate contracts. When changing notification contents, verify the relevant consumer accepts them rather than assuming every frame causes a refetch.

## Generation and Tooling

- Use pnpm through the workspace scripts or backend package scripts. The backend runs Express with TypeScript via `tsx`; development uses `nodemon` watching `src/` and `../shared/`.
- `src/scripts/preTsoaGen.ts` writes the ignored `tsoa.json` using runtime configuration, including `API_URL` and `API_PREFIX`. Change this source script for persistent generation configuration, not the generated JSON.
- `tsoa:gen:backend` runs the configuration script, `tsoa spec`, and `tsoa routes`. `tsoa:gen` additionally regenerates the frontend client from the generated Swagger document.
- Choose the backend-only command when frontend client generation is not needed. Contract changes consumed by the frontend require the complete generation workflow; do not patch frontend generated declarations manually.
- `gen:types` runs `generateJixxedTypes.ts`, reading ignored schemas and writing generated shared Jixxed types. Inspect the generator for conventions, not ignored schema contents or generated output; do not assume schemas exist on every machine.
- Preserve the TypeScript CommonJS configuration, decorator support, and strict compiler settings. Keep changes compatible with the current compilation target rather than introducing unsupported syntax or module assumptions.
- Environment configuration includes `PORT`, `CLIENT_URL`, `API_URL`, `API_PREFIX`, `ED_JOURNAL_PATH`, and platform data-location settings. Document names and behavior without reading or printing local values.
- Generation and Swagger asset lookup depend on the backend working directory. Use existing workspace delegation or run the package command from `backend/` instead of assuming paths resolve from the repository root.

## Jest Configuration and Test Boundaries

- Tests live under `tests/controllers`, `tests/services`, and `tests/utils`, generally mirroring source ownership. Files use the `.test.ts` suffix; `ApiFailureModes.test.ts` is a cross-cutting HTTP suite located in `tests/utils`, not a pure utility test.
- Jest runs in the Node environment with roots covering `src` and `tests`, and matches `**/tests/**/**/*.test.ts`. Existing suites include a Jest type-reference directive.
- `ts-jest` transforms TypeScript using `tsconfig.test.json`, which extends the backend configuration, adds Node/Jest types, and includes source and tests. Diagnostics are disabled: a passing test run does not establish TypeScript correctness.
- There is no shared setup file or `moduleNameMapper`. The `ed-shared` dependency resolves through the pnpm workspace; do not add a test-only alias to conceal a package-resolution problem.
- `clearMocks: true` clears mock call history, but does not reset implementations or restore spies. Existing suites use explicit `mockReset`, module resets, and cleanup where required.
- Most controller suites instantiate the controller and call its methods with service modules mocked through `jest.mock`. These verify delegation and return behavior, not Express routing or generated response handling.
- `ApiFailureModes.test.ts` builds a local Express app, calls generated `RegisterRoutes`, and exercises it with Supertest. It adds its own error middleware: that response behavior must not be mistaken for middleware already present in the production bootstrap.
- Prefer a local app passed to Supertest over importing `src/index.ts`, which starts a listener and has additional startup side effects. If a requested test needs a real listener, explicitly close it during teardown.
- HTTP tests importing `src/routes.ts` require generated routes to exist. Generate them through `tsoa:gen:backend`; never edit ignored route output to make assertions pass.

## Mocking, Isolation, and Fixtures

- Interpreter and SSE tests use `jest.resetModules`, `jest.doMock`, and a subsequent `require` inside setup helpers to isolate module-level caches and import-time subscriptions. Install mocks before loading the module under test.
- Typical service boundaries include filesystem access, path utilities, and `LogFileWatcher`. Existing watcher doubles use `EventEmitter`; partial filesystem mocks retain `jest.requireActual('fs')` and replace only the operations exercised by the test.
- Use separate assertions for cache hits, fallback scans, malformed JSON lines, absent data, and journal-switch invalidation. Keep transport tests distinct from business-calculation tests.
- Watcher and interpreter suites use Jest fake timers to control polling and batching. Pair fake-timer setup with timer cleanup and `useRealTimers`; close watcher instances rather than relying only on cleared timers.
- SSE suites use Node.js `PassThrough` or `Readable` doubles. Destroy subscribed streams during teardown so heartbeat timers and client sets do not leak between tests. Controller-level SSE tests also verify header setting and request-close handling.
- Restore spies and global mutations in teardown. Preserve original environment values and property descriptors when changing `process.env`, `process.platform`, or mocked home directories; restoration must still run after a failed assertion.
- The existing journal fixture is synthetic JSONL and is used to emulate a journal directory through `ED_JOURNAL_PATH`. Service suites also construct inline JSON lines and mock filesystem reads; choose the narrowest boundary for the requested behavior.
- If fixture changes are explicitly requested, keep synthetic journals under `tests/fixtures/journal/` with a `Journal*.log` name matching the ignore exception. Never copy real commander identifiers or private game logs into fixtures.
- Existing tests may lag behind current behavior. Check expectations against handwritten production code and the intended contract rather than copying an outdated assertion or changing a test solely to silence a failure.

## Test Commands, Coverage, and Reports

- Run backend package commands from `backend/` or through workspace delegation. The plain `test` script runs Jest with `--runInBand`, `--detectOpenHandles`, and coverage; it does not itself regenerate routes first.
- `test:watch` runs Jest in watch mode without the coverage flags from the plain test script. Do not use a watcher for a one-shot validation task.
- `pretest:ci` is defined to run `tsoa:gen:backend`; `test:ci` runs the test script followed by `src/scripts/checkCoverage.ts`. Confirm the package-manager lifecycle behavior or explicitly generate prerequisites before relying on that pre-script.
- Jest collects coverage from `src/**/*.ts`, excluding `src/index.ts`, `src/routes.ts`, and `src/scripts/**`. Its global thresholds are 90% for branches, functions, lines, and statements.
- `checkCoverage.ts` reads `coverage/coverage-summary.json`, fails if it is missing, and enforces 90% for each metric on each reported file, excluding the aggregate `total`. This is stricter than Jest's global thresholds.
- Jest produces text, LCOV, HTML, and JSON-summary coverage, plus `coverage/jest-report.html` through `jest-html-reporter`. These are ignored output, not source files to edit or architectural evidence of current test health.
- The `posttest` script runs `postJestReport.ts`, which enriches the generated HTML with coverage details and styles from `src/theme/jest-report.css`. It replaces its marked sections and skips with warnings when required report inputs are absent.
- `test:html` runs tests and opens the report; report-opening commands are convenience tools, not additional validation gates. The plain `posttest` lifecycle is separate from `test:watch`.
- A script named `test:ci` does not establish that pipelines execute it. Do not claim current CI coverage, passing suites, or measured coverage without checking execution evidence.

## Modification Rules

- Start with the owning layer: decorator and response contract for an endpoint, service for domain computation, interpreter for cache invalidation, watcher for file detection, or SSE service for stream delivery.
- Read a nearby implementation before extending a pattern. Cache-first domain services, file-based market access, and streaming controllers have different responsibilities.
- Preserve local indentation, quotation marks, exported function names, and existing API paths. Formatting is not uniform across controllers and services.
- Treat startup side effects, nullable responses, malformed input, journal switches, overlapping file changes, and stream disposal as distinct risks when validating a change.
- Validate the touched handwritten source with an appropriate focused check without rewriting ignored artifacts or modifying tests unless requested. Disclose runtime behavior that cannot be verified without local journals.
- Keep changes limited to the requested behavior. Do not introduce a new persistence system, restructure all services, or repair unrelated lifecycle issues as part of routine work.
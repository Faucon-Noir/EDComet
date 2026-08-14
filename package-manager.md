# Onboarding

Package management is now handled with pnpm from the workspace root. See ./docs/pnpm-migration.md for installation, migration notes, and day-to-day commands.

## Prerequisites

- Node.js 22.x or 24.x
- Corepack enabled, or pnpm installed
- Java runtime 17 or newer for the OpenAPI client generator

On Arch-based distributions such as CachyOS, install it with:

```bash
sudo pacman -S jre-openjdk
```

## First startup

From the root of the repository:

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
pnpm run tsoa:gen
```

Then, open two terminals from the root:

```bash
pnpm run dev:backend
pnpm run dev:frontend
```

## Useful commands

```bash
pnpm run build
pnpm run lint
pnpm run test
pnpm run client:gen
pnpm run tsoa:gen
```

## Points of attention

- Work from the root of the repository to keep a single lockfile.
- The frontend client is generated from the backend. If the API changes, rerun `pnpm run tsoa:gen`.
- Details of the Yarn -> pnpm migration and command equivalences are documented in `docs/pnpm-migration.md`.

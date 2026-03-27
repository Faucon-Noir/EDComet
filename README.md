# ED COMET

Package management is now handled with pnpm from the workspace root. See ./docs/pnpm-migration.md for installation, migration notes, and day-to-day commands.

## Onboarding

### Prerequis

- Node.js 22.x recommande
- Corepack active, ou pnpm installe

### Premier demarrage

Depuis la racine du depot :

```bash
corepack enable
corepack prepare pnpm@10.11.1 --activate
pnpm install
pnpm run tsoa:gen
```

Ensuite, ouvrez deux terminaux depuis la racine :

```bash
pnpm run dev:backend
pnpm run dev:frontend
```

### Commandes utiles

```bash
pnpm run build
pnpm run lint
pnpm run test
pnpm run client:gen
pnpm run tsoa:gen
```

### Points d'attention

- Travaillez depuis la racine du depot pour garder un lockfile unique.
- Le client frontend est genere a partir du backend. Si l'API change, relancez `pnpm run tsoa:gen`.
- Le detail de la migration Yarn -> pnpm et les equivalences de commandes sont documentes dans `docs/pnpm-migration.md`.

This is a companion tool to simplify the colonisation building process
Dock to your Construction Site, & let the tool do its stuff. It will provide you with evverything you need to know, from a friendly list of what you need to the nearests markets were you can find what you need.
Work for every Construction Site
Markets supplies are planned to query the EDDN API, still need to discuss with them

We use the [Jixxed's Journal doc](https://jixxed.github.io/ed-journal-schemas/index.html) for types references

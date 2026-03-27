# Migration vers pnpm

## Objectif

Le workspace EDComet utilisait Yarn de maniere implicite dans les sous-projets `backend` et `frontend`.
La migration effectuee ici standardise la gestion des dependances avec pnpm pour l'ensemble du depot.

## Ce qui a ete change

### 1. Ajout d'une racine de workspace pnpm

Deux fichiers ont ete ajoutes a la racine :

- `package.json` : declaration du workspace root et scripts pratiques pour lancer les commandes les plus frequentes.
- `pnpm-workspace.yaml` : declaration des packages geres par pnpm (`backend` et `frontend`).

Le `package.json` racine contient aussi la configuration pnpm necessaire pour autoriser les scripts d'installation des dependances qui en ont reellement besoin (`esbuild`, `@openapitools/openapi-generator-cli`, `@nestjs/core`) et ignorer explicitement `@scarf/scarf`.

### 2. Migration des manifests backend et frontend

Les champs `packageManager` ont ete remplaces pour pointer vers `pnpm@10.11.1` dans :

- `backend/package.json`
- `frontend/package.json`

### 3. Remplacement des appels Yarn dans les scripts

Les scripts qui invoquaient Yarn ont ete convertis en commandes compatibles pnpm.

Cas notables :

- `backend/package.json`
  - `test` utilise maintenant `pnpm run open-index`.
  - `tsoa:gen` n'appelle plus `yarn tsoa ...`, mais execute directement les binaires locaux `tsoa` puis declenche `pnpm --dir ../frontend run client:gen`.
- `backend/nodemon.json`
  - l'execution passe de `yarn tsoa:gen` a `pnpm run tsoa:gen`.

### 4. Nettoyage des artefacts Yarn

Les lockfiles Yarn doivent etre remplaces par un lockfile pnpm unique a la racine du workspace :

- suppression attendue de `backend/yarn.lock`
- suppression attendue de `frontend/yarn.lock`
- ajout attendu de `pnpm-lock.yaml`

### 5. Mise a jour de la documentation

Le `README.md` reference maintenant cette documentation de migration.

## Points d'attention

### Fresh clone

Le depot etait dans un etat sans `node_modules`. C'est une bonne base pour une migration, car cela evite les artefacts croises entre Yarn et pnpm.

### Workspace root

La commande d'installation doit maintenant etre lancee depuis la racine du depot, pas depuis chaque sous-dossier si l'on veut beneficier du lockfile unique et de la resolution centralisee.

### Scripts croises backend/frontend

Le backend declenche une generation de client dans le frontend. Avec pnpm, cela fonctionne via :

```bash
pnpm --dir ../frontend run client:gen
```

L'avantage est d'eviter un `cd` implicite couple a Yarn, et de rendre l'intention plus explicite.

### Node et Corepack

Sur les environnements qui n'ont pas pnpm installe globalement, il est recommande d'utiliser Corepack :

```bash
corepack enable
corepack prepare pnpm@10.11.1 --activate
```

Avec Node.js recent, Corepack est en general deja disponible.

### Scripts de build des dependances avec pnpm v10

Depuis pnpm v10, les scripts d'installation des dependances ne sont plus executes automatiquement si le package n'est pas explicitement approuve.

Dans ce depot, cette approbation est versionnee dans le `package.json` racine via la cle `pnpm` pour eviter une etape interactive sur un fresh clone.

Packages explicitement autorises :

- `esbuild`
- `@openapitools/openapi-generator-cli`
- `@nestjs/core`

Package explicitement ignore :

- `@scarf/scarf`

### Differences utiles entre Yarn et pnpm

- pnpm utilise un store global adresse par contenu, puis cree des liens dans `node_modules`.
- le lockfile de reference devient `pnpm-lock.yaml` a la racine.
- dans un workspace, les commandes ciblees passent souvent par `--filter`.
- pour executer une commande dans un dossier precis, `pnpm --dir <path> run <script>` est souvent plus propre qu'un `cd` enchaine.

## Installation

Depuis la racine du depot :

```bash
pnpm install
```

Si vous venez d'une installation faite avant l'ajout de la configuration `pnpm.onlyBuiltDependencies`, forcez une reconstruction une fois :

```bash
pnpm rebuild
```

Si pnpm n'est pas disponible :

```bash
corepack enable
corepack prepare pnpm@10.11.1 --activate
pnpm install
```

## Onboarding developpeur

### Parcours minimal apres un fresh clone

Depuis la racine du depot :

```bash
corepack enable
corepack prepare pnpm@10.11.1 --activate
pnpm install
pnpm run tsoa:gen
```

Puis lancez les applications dans deux terminaux distincts :

```bash
pnpm run dev:backend
pnpm run dev:frontend
```

### Ordre recommande

1. Installer les dependances avec `pnpm install`.
2. Generer les artefacts backend et le client frontend avec `pnpm run tsoa:gen`.
3. Demarrer le backend.
4. Demarrer le frontend.

### Quand regenerer le client API

Relancez `pnpm run tsoa:gen` dans les cas suivants :

- modification des controllers ou contrats backend exposes par tsoa
- changement du schema OpenAPI
- suppression du dossier frontend `src/api`

### Checklist nouvel arrivant

```bash
pnpm install
pnpm run tsoa:gen
pnpm run dev:backend
pnpm run dev:frontend
pnpm run build
```

## Commandes usuelles

### Depuis la racine

Installation de toutes les dependances :

```bash
pnpm install
```

Lancer le backend :

```bash
pnpm run dev:backend
```

Lancer le frontend :

```bash
pnpm run dev:frontend
```

Builder le frontend :

```bash
pnpm run build
```

Linter le frontend :

```bash
pnpm run lint
```

Lancer les tests backend :

```bash
pnpm run test
```

Generer les artefacts tsoa et le client frontend :

```bash
pnpm run tsoa:gen
pnpm run client:gen
```

### En ciblant directement un package

Lancer le backend :

```bash
pnpm --filter ed-comet-backend run dev
```

Lancer le frontend :

```bash
pnpm --filter ed-comet run dev
```

Linter uniquement le frontend :

```bash
pnpm --filter ed-comet run lint
```

Generer le client OpenAPI du frontend :

```bash
pnpm --filter ed-comet run client:gen
```

### Depuis un sous-dossier

Si vous travaillez deja dans `backend` ou `frontend`, ces commandes restent valides :

```bash
pnpm install
pnpm run <script>
```

Mais pour garder un lockfile unique et un comportement coherent, il vaut mieux privilegier la racine du workspace.

## Equivalences Yarn -> pnpm

```bash
yarn install               -> pnpm install
yarn dev                   -> pnpm run dev
yarn build                 -> pnpm run build
yarn lint                  -> pnpm run lint
yarn tsoa:gen              -> pnpm run tsoa:gen
yarn client:gen            -> pnpm run client:gen
yarn workspace <pkg> <cmd> -> pnpm --filter <pkg> run <cmd>
```

## Recommandations d'usage

- Lancez `pnpm install` depuis la racine apres chaque fresh clone.
- Committez `pnpm-lock.yaml` et ne committez pas `node_modules`.
- Evitez de reintroduire `yarn.lock` ou des scripts qui invoquent explicitement Yarn.
- Si un nouveau package est ajoute au depot, ajoutez-le aussi dans `pnpm-workspace.yaml`.

## Verification post-migration

Checklist recommandee :

```bash
pnpm install
pnpm run dev:frontend
pnpm run dev:backend
pnpm run build
pnpm run lint
pnpm run tsoa:gen
```

Selon l'etat fonctionnel du backend, certains scripts peuvent dependre de fichiers generes ou d'outils deja attendus par le projet. La migration pnpm ne corrige pas les problemes applicatifs preexistants ; elle remplace uniquement le gestionnaire de paquets et l'orchestration des commandes.
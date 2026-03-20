# Getting started

## Installation

```sh
git clone https://github.com/jn-prod/www-vtt-bzh.git
cd www-vtt-bzh
corepack enable
pnpm install
```

## Développement local

```sh
# Site Jekyll (live reload)
pnpm dev

# Générer les événements depuis Supabase (nécessite les vars d'env)
SUPABASE_URL=... SUPABASE_KEY=... pnpm --filter=calendar-job run generate-events

# Prévisualiser le build complet
pnpm preview
```

## Tests

```sh
pnpm test
```

## Lint

```sh
pnpm lint
pnpm lint:fix
```

## Build

```sh
pnpm build
# → site généré dans dist/
```

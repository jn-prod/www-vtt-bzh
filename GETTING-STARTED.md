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
SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... SUPABASE_TABLE=events pnpm --filter=calendar build:events

# Générer une matière calendrier depuis Supabase pour une fenêtre donnée
pnpm --silent newsletter:new -- --start=2026-10-01 --end=2026-11-05

# Utiliser ponctuellement un autre template
pnpm --silent newsletter:new -- --start=2026-10-01 --end=2026-11-05 --template=chemin/vers/newsletter.md

# Prévisualiser le build complet
pnpm build:preview
```

Le template par défaut est `packages/calendar/templates/newsletter.md`. Le script remplace ses marqueurs `@@VARIABLE@@`
et ses sections `@@IF_SECTION@@` / `@@END_SECTION@@`. Il produit un brief factuel non publiable qui respecte le contrat
`source_id` / `source` et ne contient aucune donnée personnelle des organisateurs.

La commande lit directement les événements publics de Supabase. Elle écrit un brouillon Markdown dans `www/_drafts/`, le dossier Jekyll de vtt.bzh, sous le nom `YYYY-MM-DD_YYYY-MM-DD-la-sortie.md`. Définir `NEWSLETTER_DRAFTS_DIR` dans `.env` pour utiliser un autre dossier local. Elle accepte `--update` pour régénérer la même fenêtre sans créer un second fichier.

À partir de ce brouillon, composer l'édition de La Sortie dans nicolasjouanno.com, où l'archive est publiée. Après relecture, l'envoi reste manuel dans Kit : cibler les consentements des formulaires **VTT.bzh visiteurs** (`9677378`) et **La Sortie sur nicolasjouanno.com** (`9378910`), sans utiliser seul le tag historique `agenda-mensuel`.

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
# → site généré dans www/_site/
```

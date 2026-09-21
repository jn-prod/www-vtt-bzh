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

# Générer une matière calendrier depuis Supabase et le template Markdown
pnpm newsletter:new -- --period=2026-09

# Utiliser ponctuellement un autre template
pnpm newsletter:new -- --period=2026-09 --template=chemin/vers/newsletter.md

# Prévisualiser le build complet
pnpm build:preview
```

Le template par défaut est `packages/calendar/templates/newsletter.md`. Le script remplace ses marqueurs `@@VARIABLE@@`
et ses sections `@@IF_SECTION@@` / `@@END_SECTION@@`. Il produit un brief factuel non publiable qui respecte le contrat
`source_id` / `source` et ne contient aucune donnée personnelle des organisateurs.

La commande accepte `--update` pour régénérer le même brief local sans créer un second fichier. L'action GitHub **Generate La Sortie source brief** ne demande aucune période : elle prépare toujours M+1, calculé en heure de Paris, et publie uniquement un artefact disponible sept jours. Elle ne crée ni branche, ni PR, ni contenu public.

À partir de ce brief, composer l'édition de La Sortie dans `www-nicolasjouanno-com`, où l'archive est publiée. Après relecture, l'envoi reste manuel dans Kit : cibler les consentements des formulaires **VTT.bzh visiteurs** (`9677378`) et **La Sortie sur nicolasjouanno.com** (`9378910`), sans utiliser seul le tag historique `agenda-mensuel`.

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

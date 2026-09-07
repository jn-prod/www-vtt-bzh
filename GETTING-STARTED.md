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

# Générer un brouillon de newsletter depuis Supabase et le template Markdown
pnpm newsletter:new -- --period=2026-09

# Utiliser ponctuellement un autre template
pnpm newsletter:new -- --period=2026-09 --template=chemin/vers/newsletter.md

# Prévisualiser le build complet
pnpm build:preview
```

Le template par défaut est `packages/calendar/templates/newsletter.md`. Le script remplace ses marqueurs `@@VARIABLE@@`
et ses sections `@@IF_SECTION@@` / `@@END_SECTION@@`, puis refuse tout résultat qui ne conserve pas les verrous
`sent: false` et `published: false`.

La commande accepte `--update` pour régénérer le brouillon existant du même mois sans créer un second fichier. L'action GitHub **Generate newsletter draft** ne demande aucune période : elle prépare toujours M+1, calculé en heure de Paris. Elle conserve la branche `newsletter/YYYY-MM`, ajoute un nouveau commit et met à jour la PR ouverte. Une édition finalisée reste intacte.

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

# vtt.bzh — Monorepo

Site statique du calendrier des randonnées VTT de Bretagne.

- **URL** : https://vtt.bzh
- **Repo** : https://github.com/jn-prod/www-vtt-bzh

---

## Structure du monorepo

```
www-vtt-bzh/
├── www/                    # Site Jekyll (Jekyll 4, CSS natif BEM, Vanilla JS)
├── packages/
│   ├── type/               # Types utilitaires partagés (Result, Maybe, error)
│   ├── http-client/        # Client HTTP + linkedom
│   ├── repository/         # Abstraction Supabase
│   └── calendar/           # Types CalendarEvent + script generate-events → out/events.json
├── supabase/
│   ├── migrations/         # Migrations SQL (RLS, schéma)
│   └── functions/          # Edge Functions (notif email modération)
├── scripts/                # Scripts utilitaires Node (backup, ad-hoc)
├── configs/
│   └── tsconfig/           # tsconfig.json de base partagé (node)
├── .github/workflows/      # CI GitHub Actions (build & deploy uniquement)
├── eslint.config.mjs       # Config ESLint racine (flat config)
├── .stylelintrc.json       # Config Stylelint racine
├── .prettierrc.js          # Config Prettier racine
└── package.json            # Scripts racine, devDependencies partagées
```

---

## Packages

| Package       | Description                                                                          |
| ------------- | ------------------------------------------------------------------------------------ |
| `www`         | Site Jekyll — layouts Liquid, CSS BEM, JS ES modules                                 |
| `type`        | Types utilitaires TypeScript : `Result<T,E>`, `Maybe<T>`, helpers d'erreur           |
| `http-client` | Client HTTP basé sur `linkedom`, abstraction des requêtes                            |
| `repository`  | Abstraction Supabase : `createClient`, `updateOrCreate`                              |
| `calendar`    | Types `CalendarEvent` + script `generate-events` → `out/events.json` depuis Supabase |
| `tsconfig`    | Configs TypeScript de base partagées                                                 |

---

## Prérequis

- Node.js 24.x
- pnpm 10.x (`corepack enable`)
- Ruby (`rbenv` ou `.ruby-version`) — pour le site Jekyll

---

## Démarrage rapide

```bash
git clone https://github.com/jn-prod/www-vtt-bzh.git
cd www-vtt-bzh
corepack enable
pnpm install
```

---

## Scripts racine

| Commande              | Description                                         |
| --------------------- | --------------------------------------------------- |
| `pnpm dev`            | Lance le dev de tous les packages (Jekyll serve)    |
| `pnpm build`          | Build packages → copie `events.json` → build Jekyll |
| `pnpm build:preview`  | Build complet + serveur HTTP local sur `www/_site/` |
| `pnpm build:www`      | Build Jekyll uniquement                             |
| `pnpm build:packages` | Compile tous les packages TypeScript                |
| `pnpm test`           | Tests de tous les packages                          |
| `pnpm lint`           | ESLint + Stylelint + Prettier (vérification)        |
| `pnpm lint:fix`       | ESLint + Stylelint + Prettier (auto-fix)            |
| `pnpm lint:eslint`    | ESLint uniquement                                   |
| `pnpm lint:stylelint` | Stylelint uniquement                                |
| `pnpm lint:prettier`  | Prettier uniquement                                 |

---

## CI/CD

Un seul workflow GitHub Actions : build & deploy.

### `github-pages.yml` — Déploiement (push `main` ou manuel)

1. `pnpm install` + `bundle install` (Node + Ruby)
2. `pnpm --filter=calendar run generate-events` — Supabase → `packages/calendar/out/events.json`
3. `pnpm build` — compile packages → copie `events.json` → Jekyll → `www/_site/`
4. Deploy sur GitHub Pages (`peaceiris/actions-gh-pages`, CNAME `www.vtt.bzh`)

L'alimentation des événements ne dépend plus d'un cron ni d'un scraper : les organisateurs publient directement via le formulaire `/calendrier/ajouter.html` qui POST vers Supabase (RLS).

### Secrets GitHub Actions requis

| Secret           | Environment    | Description                    |
| ---------------- | -------------- | ------------------------------ |
| `SUPABASE_URL`   | `github-pages` | URL du projet Supabase         |
| `SUPABASE_KEY`   | `github-pages` | Clé anon Supabase              |
| `SUPABASE_TABLE` | `github-pages` | Nom de la table des événements |

---

## Tooling

- **Gestionnaire de packages** : pnpm 10 (workspaces)
- **Linter JS/TS** : ESLint 9 (flat config) + `typescript-eslint` v8
- **Linter CSS** : Stylelint 16 + `stylelint-config-standard`
- **Formatter** : Prettier 3
- **Git hooks** : Husky + lint-staged (lint au commit)
- **TypeScript** : ts-node (packages uniquement — pas de bundler côté site)

---

## Documentation

- [www/README.md](./www/README.md) — conventions Jekyll, BEM, JS, structure du site
- [GETTING-STARTED.md](./GETTING-STARTED.md) — installation et commandes de dev

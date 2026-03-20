# vtt.bzh — Monorepo

Site statique du calendrier des randonnées VTT de Bretagne.

- **URL** : https://vtt.bzh
- **Repo** : https://github.com/jn-prod/www-vtt-bzh

---

## Structure du monorepo

```
www-vtt-bzh/
├── www/                    # Site Jekyll (Jekyll 4, SCSS BEM, Vanilla JS)
├── packages/
│   ├── calendar-job/       # Job TypeScript — génère _data/events.yaml depuis Supabase
│   ├── http-client/        # Client HTTP partagé
│   ├── repository/         # Couche d'accès aux données Supabase
│   └── types/              # Types partagés entre packages
├── configs/
│   └── tsconfig/           # tsconfig.json de base (node, bundler)
├── .github/workflows/      # CI GitHub Actions
├── .eslintrc.js            # Config ESLint racine
├── .prettierrc.js          # Config Prettier racine
└── package.json            # Scripts racine, devDependencies partagées
```

---

## Packages

| Package | Description |
|---|---|
| `www` | Site Jekyll — layouts Liquid, SCSS BEM, JS ES modules |
| `calendar-job` | Job ts-node — récupère les événements Supabase, écrit `_data/events.yaml` |
| `http-client` | Wrapper fetch partagé entre les packages Node |
| `repository` | Accès Supabase (events table) |
| `types` | Interfaces et DTOs TypeScript partagés |
| `tsconfig` | Configs TypeScript de base partagées |

---

## Prérequis

- Node.js 24.x
- pnpm 10.x (`corepack enable`)
- Ruby 4.0.2 (`rbenv` ou `.ruby-version`) — pour le site Jekyll

---

## Démarrage rapide

```bash
git clone https://github.com/jn-prod/www-vtt-bzh.git
cd www-vtt-bzh
corepack enable
pnpm install
```

Voir [GETTING-STARTED.md](./GETTING-STARTED.md) pour le détail des commandes de dev et de CI.

---

## Scripts racine

| Commande | Description |
|---|---|
| `pnpm dev` | Lance le dev de tous les packages (Jekyll serve) |
| `pnpm build` | Build de tous les packages + copie dans `dist/` |
| `pnpm preview` | Build + serveur HTTP local sur `dist/` |
| `pnpm test` | Tests de tous les packages |
| `pnpm lint` | Lint de tous les packages |
| `pnpm lint:fix` | Lint + auto-fix |

---

## CI/CD

Le déploiement est automatisé via **GitHub Actions** (`.github/workflows/github-pages.yml`) à chaque push sur `main` :

1. `pnpm install` — installation des dépendances Node et Ruby
2. `calendar-job generate-events` — récupère les événements Supabase, génère `www/_data/events.yaml`
3. `pnpm build` — build Jekyll → `www/_site/` → copie dans `dist/`
4. `pnpm lint` — vérification ESLint/Prettier
5. Deploy sur GitHub Pages via `peaceiris/actions-gh-pages`

**Secrets GitHub Actions requis** : `SUPABASE_URL`, `SUPABASE_KEY`

---

## Tooling

- **Gestionnaire de packages** : pnpm 10 (workspaces)
- **Linter** : ESLint 8 + `@typescript-eslint` v7
- **Formatter** : Prettier 3
- **Git hooks** : Husky + lint-staged (lint au commit)
- **TypeScript** : ts-node (packages Node uniquement — pas de bundler côté site)

---

## Documentation

- [www/README.md](./www/README.md) — conventions Jekyll, BEM, JS, structure du site
- [GETTING-STARTED.md](./GETTING-STARTED.md) — installation et commandes dev

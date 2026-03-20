# vtt.bzh — Monorepo

Site statique du calendrier des randonnées VTT de Bretagne.

- **URL** : https://vtt.bzh
- **Repo** : https://github.com/jn-prod/www-vtt-bzh

---

## Structure du monorepo

```
www-vtt-bzh/
├── www/                    # Site Jekyll (Jekyll 4, CSS natif BEM, Vanilla JS)
├── jobs/                   # Job TypeScript — fetch Wufoo + scraping web → Supabase → events.yaml
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
| `www` | Site Jekyll — layouts Liquid, CSS BEM, JS ES modules |
| `jobs` | Job ts-node — récupère les événements (Wufoo + scraping), écrit `_data/events.yaml` via Supabase |
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

---

## Scripts racine

| Commande | Description |
|---|---|
| `pnpm dev` | Lance le dev de tous les packages (Jekyll serve) |
| `pnpm build` | Build de tous les packages + copie dans `dist/` |
| `pnpm preview` | Build + serveur HTTP local sur `dist/` |
| `pnpm job` | Exécute le job de récupération des événements |
| `pnpm test` | Tests de tous les packages |
| `pnpm lint` | Lint de tous les packages |
| `pnpm lint:fix` | Lint + auto-fix |

---

## CI/CD

Deux workflows GitHub Actions automatisent le pipeline complet.

### `jobs.yml` — Cron quotidien (2h UTC) + déclenchement manuel

1. `pnpm install` — installation des dépendances
2. `pnpm job` — fetch Wufoo + scraping web → upsert Supabase
3. Déclenche automatiquement `github-pages.yml` via `workflow_run` en cas de succès

### `github-pages.yml` — Déploiement (après `jobs.yml` OU push `main` OU manuel)

1. `pnpm install` + `bundle install` (Node + Ruby)
2. `pnpm --filter=jobs run generate-events` — Supabase → `www/_data/events.yaml`
3. `pnpm build` — Jekyll → `www/_site/` → `dist/`
4. `pnpm lint`
5. Deploy sur GitHub Pages (`peaceiris/actions-gh-pages`, CNAME `www.vtt.bzh`)

### Secrets GitHub Actions requis

| Secret | Environment | Description |
|---|---|---|
| `CRON_START_URI` | `cron` | URL de démarrage du cron web scraping |
| `WUFOO_USERNAME` | `cron` | Identifiant API Wufoo |
| `WUFOO_PASSWORD` | `cron` | Mot de passe API Wufoo |
| `WUFOO_DOMAIN` | `cron` | Domaine Wufoo |
| `WUFOO_FORM` | `cron` | ID du formulaire Wufoo |
| `SUPABASE_URL` | `cron` + `github-pages` | URL du projet Supabase |
| `SUPABASE_KEY` | `cron` + `github-pages` | Clé anon Supabase |
| `SUPABASE_TABLE` | `cron` + `github-pages` | Nom de la table des événements |

---

## Tooling

- **Gestionnaire de packages** : pnpm 10 (workspaces)
- **Linter** : ESLint 8 + `@typescript-eslint` v7
- **Formatter** : Prettier 3
- **Git hooks** : Husky + lint-staged (lint au commit)
- **TypeScript** : ts-node (job uniquement — pas de bundler côté site)

---

## Documentation

- [www/README.md](./www/README.md) — conventions Jekyll, BEM, JS, structure du site

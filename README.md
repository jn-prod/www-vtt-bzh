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
│   ├── repository/         # Abstraction Supabase
│   └── calendar/           # Types CalendarEvent + script generate-events → out/events.json
├── supabase/
│   ├── migrations/         # Migrations SQL (RLS, schéma)
│   └── functions/          # Edge Functions (soumission contrôlée, notif modération)
├── scripts/                # Scripts utilitaires Node (backup, ad-hoc)
├── configs/
│   └── tsconfig/           # tsconfig.json de base partagé (node)
├── .github/workflows/      # CI GitHub Actions (contrôles, build et déploiement)
├── eslint.config.mjs       # Config ESLint racine (flat config)
├── .stylelintrc.json       # Config Stylelint racine
├── .prettierrc.js          # Config Prettier racine
└── package.json            # Scripts racine, devDependencies partagées
```

---

## Packages

| Package      | Description                                                                          |
| ------------ | ------------------------------------------------------------------------------------ |
| `www`        | Site Jekyll — layouts Liquid, CSS BEM, JS ES modules                                 |
| `type`       | Types utilitaires TypeScript : `Result<T,E>`, `Maybe<T>`, helpers d'erreur           |
| `repository` | Abstraction Supabase : `createClient`, `updateOrCreate`                              |
| `calendar`   | Types `CalendarEvent` + script `generate-events` → `out/events.json` depuis Supabase |
| `tsconfig`   | Configs TypeScript de base partagées                                                 |

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
| `pnpm test:e2e`       | Parcours Playwright et contrôles Axe                |
| `pnpm validate:html`  | Validation du HTML généré                           |
| `pnpm validate:site`  | Liens, assets et invariants métier du site généré   |
| `pnpm minify:site`    | Minification conservative du HTML généré            |
| `pnpm check`          | Chaîne locale complète, hors installation           |
| `pnpm lint`           | ESLint + Stylelint + Prettier (vérification)        |
| `pnpm lint:fix`       | ESLint + Stylelint + Prettier (auto-fix)            |
| `pnpm lint:eslint`    | ESLint uniquement                                   |
| `pnpm lint:stylelint` | Stylelint uniquement                                |
| `pnpm lint:prettier`  | Prettier uniquement                                 |

---

## CI/CD

Le workflow de publication conserve la production précédente dès qu'un contrôle échoue.

### `github-pages.yml` — Déploiement (push `main` ou manuel)

1. Installation verrouillée des dépendances Node et Ruby
2. Lint et tests unitaires
3. Build : Supabase → normalisation → `events.json` → Jekyll
4. Validation HTML, liens, assets et invariants métier
5. Parcours Playwright et contrôles Axe
6. Déploiement GitHub Pages (`peaceiris/actions-gh-pages`, CNAME `www.vtt.bzh`)

Les organisateurs soumettent une randonnée via `/calendrier/ajouter.html`. L'Edge Function `submit-event` valide le payload, fixe les champs système et applique la limitation de débit avant l'insertion Supabase. La publication statique est reconstruite quotidiennement et après chaque push sur `main`.

### Secrets GitHub Actions requis

| Secret                     | Environment    | Description                      |
| -------------------------- | -------------- | -------------------------------- |
| `SUPABASE_URL`             | `github-pages` | URL du projet Supabase           |
| `SUPABASE_PUBLISHABLE_KEY` | `github-pages` | Clé publique utilisée en lecture |
| `SUPABASE_TABLE`           | `github-pages` | Nom de la table des événements   |

---

## Tooling

- **Gestionnaire de packages** : pnpm 10 (workspaces)
- **Linter JS/TS** : ESLint 10 (flat config) + `typescript-eslint` v8
- **Linter CSS** : Stylelint 17 + `stylelint-config-standard`
- **Formatter** : Prettier 3
- **Git hooks** : Husky + lint-staged (lint au commit)
- **TypeScript** : ts-node (packages uniquement — pas de bundler côté site)

---

## Documentation

- [www/README.md](./www/README.md) — conventions Jekyll, BEM, JS, structure du site
- [GETTING-STARTED.md](./GETTING-STARTED.md) — installation et commandes de dev

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
│   └── calendar/           # Types CalendarEvent + script generate-events → artefact privé
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

| Package      | Description                                                                                |
| ------------ | ------------------------------------------------------------------------------------------ |
| `www`        | Site Jekyll — layouts Liquid, CSS BEM, JS ES modules                                       |
| `type`       | Types utilitaires TypeScript : `Result<T,E>`, `Maybe<T>`, helpers d'erreur                 |
| `repository` | Abstraction Supabase : `createClient`, `updateOrCreate`                                    |
| `calendar`   | Types `CalendarEvent` + script `generate-events` → artefact de build privé depuis Supabase |
| `tsconfig`   | Configs TypeScript de base partagées                                                       |

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

| Commande              | Description                                                                |
| --------------------- | -------------------------------------------------------------------------- |
| `pnpm dev`            | Lance le dev de tous les packages (Jekyll serve)                           |
| `pnpm build`          | Build packages → copie l’artefact privé des événements → build Jekyll      |
| `pnpm build:preview`  | Build complet + serveur HTTP local sur `www/_site/`                        |
| `pnpm build:www`      | Build Jekyll uniquement                                                    |
| `pnpm build:packages` | Compile tous les packages TypeScript                                       |
| `pnpm newsletter:new` | Génère une matière calendrier Markdown pour Rando Bretagne depuis Supabase |
| `pnpm test`           | Tests de tous les packages                                                 |
| `pnpm test:e2e`       | Parcours Playwright et contrôles Axe                                       |
| `pnpm validate:html`  | Validation du HTML généré                                                  |
| `pnpm validate:site`  | Liens, assets et invariants métier du site généré                          |
| `pnpm minify:site`    | Minification conservative du HTML généré                                   |
| `pnpm check`          | Chaîne locale complète, hors installation                                  |
| `pnpm lint`           | ESLint + Stylelint + Prettier (vérification)                               |
| `pnpm lint:fix`       | ESLint + Stylelint + Prettier (auto-fix)                                   |
| `pnpm lint:eslint`    | ESLint uniquement                                                          |
| `pnpm lint:stylelint` | Stylelint uniquement                                                       |
| `pnpm lint:prettier`  | Prettier uniquement                                                        |

---

## CI/CD

Le workflow de publication conserve la production précédente dès qu'un contrôle échoue.

### `github-pages.yml` — Déploiement (push `main` ou manuel)

1. Installation verrouillée des dépendances Node et Ruby
2. Lint et tests unitaires
3. Build : Supabase → normalisation → artefact non versionné → Jekyll
4. Validation HTML, liens, assets et invariants métier
5. Parcours Playwright et contrôles Axe
6. Déploiement GitHub Pages (`peaceiris/actions-gh-pages`, CNAME `www.vtt.bzh`)

Les organisateurs soumettent une randonnée via `/calendrier/ajouter.html`. L'Edge Function `submit-event` valide le payload, fixe les champs système et applique la limitation de débit avant l'insertion Supabase. La publication statique est reconstruite quotidiennement et après chaque push sur `main`.

### `generate-newsletter.yml` — Matière mensuelle manuelle

L'action manuelle calcule toujours le mois suivant en heure de Paris et génère un brief factuel depuis Supabase. Il contient les cinq prochaines semaines de calendrier VTT, sans créer de branche, de PR, de commit ni de contenu public. Une relance produit simplement un nouvel artefact temporaire : l'action reste utile même si le mois a déjà été préparé.

Télécharger l'artefact puis sélectionner et contextualiser cette matière dans l'édition mensuelle **Rando Bretagne**, publiée de façon canonique sur [nicolasjouanno.com/newsletter/](https://www.nicolasjouanno.com/newsletter/). L'archive, l'édito et l'appel aux retours vivent sur ce site ; vtt.bzh conserve le calendrier, les données et l'entrée d'acquisition.

Après relecture, l'envoi reste manuel dans Kit. La cible doit réunir les consentements issus des formulaires **VTT.bzh visiteurs** (`9677378`) et **Rando Bretagne sur nicolasjouanno.com** (`9378910`) ; le tag historique `agenda-mensuel` ne doit pas servir seul de cible. Ne modifier ni abonnements ni consentements depuis ce dépôt.

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

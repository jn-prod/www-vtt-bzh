# AGENTS.md — Instructions pour les agents IA

## 1. Lire les README avant toute intervention

Avant de commencer toute tâche sur ce projet, consulter les README suivants dans l'ordre :

1. [README.md](./README.md) — Vue d'ensemble du monorepo (structure, packages, CI, tooling)
2. [www/README.md](./www/README.md) — Conventions du site Jekyll (BEM, Liquid, JS, données)
3. [GETTING-STARTED.md](./GETTING-STARTED.md) — Installation et commandes de dev

Ces fichiers contiennent les conventions de code, la structure des fichiers, et les décisions d'architecture à respecter.

---

## 2. Stack et conventions clés

- **Site** : Jekyll 4, CSS natif BEM, Vanilla JS ES modules — pas de framework CSS, pas de bundler côté site
- **Packages** : TypeScript exécuté par `ts-node` — `packages/calendar`, `packages/repository`, `packages/type`
- **Monorepo** : pnpm workspaces (`packages/*`, `configs/*`, `www`) — pas de Turborepo
- **Données** : Supabase (table `events`, RLS strict). Les soumissions publiques passent par le formulaire `/calendrier/ajouter.html`, puis par l'Edge Function `submit-event` qui valide et limite les requêtes avant l'écriture.
- **Modération** : a posteriori via Edge Function `supabase/functions/notify-new-event` (Resend), les events sont `active=true` par défaut et masquables via `active=false` dans le dashboard.
- **CSS** : convention BEM stricte (`.block__element--modifier`), Flexbox natif, tout dans `www/assets/css/main.css`
- **HTML** : HTML sémantique, `<details>/<summary>` pour les accordéons — pas de JS pour le toggle
- **JS** : ES modules natifs (`<script type="module">`), filtrage des événements par attribut `hidden`

---

## 3. Linting et formatage

Les trois outils de lint sont centralisés à la racine et s'exécutent via `pnpm lint` / `pnpm lint:fix`.

| Outil     | Périmètre         | Config              |
| --------- | ----------------- | ------------------- |
| ESLint 9  | `*.ts`, `*.js`    | `eslint.config.mjs` |
| Stylelint | `*.css`           | `.stylelintrc.json` |
| Prettier  | tous les fichiers | `.prettierrc.js`    |

Avant tout commit, lint-staged applique automatiquement les fixs via Husky.

---

## 4. Ce qu'il ne faut pas faire

- Ne pas introduire de framework CSS (Bootstrap, Tailwind…)
- Ne pas introduire de bundler côté site (Webpack, Vite…)
- Ne pas utiliser de classes utilitaires inline — tout CSS passe par `www/assets/css/main.css`
- Ne pas publier de packages npm — ce projet est un site personnel, pas une librairie
- Ne pas modifier `.eslintrc.js` — ce fichier n'existe plus, la config ESLint est dans `eslint.config.mjs`

## Gouvernance studio

Ce repo appartient au studio de Nicolas Jouanno. La gouvernance transverse — doctrine, décisions,
projets, tâches, mémoire et analytics — vit dans le dépôt privé `corp-ai`, hors de ce dépôt public.

Dans l'espace de travail local standard, le point d'entrée unique est
`../corp-ai/studio/README.md`. Lire ensuite uniquement les notes auxquelles cette page renvoie pour
la tâche en cours ; en cas de conflit, `../corp-ai/studio/DOCTRINE-LOCALE.md` prévaut.

Notion n'est pas une dépendance opérationnelle. Si le dépôt `corp-ai` n'est pas accessible,
signaler l'absence de contexte au fondateur plutôt que d'improviser une doctrine locale.

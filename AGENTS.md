# AGENTS.md — Instructions pour les agents IA

## 1. Lire les README avant toute intervention

Avant de commencer toute tâche sur ce projet, consulter les README suivants dans l'ordre :

1. [README.md](./README.md) — Vue d'ensemble du monorepo (structure, packages, CI, tooling)
2. [www/README.md](./www/README.md) — Conventions du site Jekyll (BEM, Liquid, JS, données)
3. [GETTING-STARTED.md](./GETTING-STARTED.md) — Installation et commandes de dev

Ces fichiers contiennent les conventions de code, la structure des fichiers, et les décisions d'architecture à respecter.

---

## 2. Stack et conventions clés

- **Site** : Jekyll 4, SCSS BEM natif, Vanilla JS ES modules — pas de framework CSS, pas de bundler côté site
- **Job** : TypeScript compilé par `ts-node` (`packages/calendar-job`) — seule partie compilée
- **Monorepo** : pnpm workspaces, pas de Turborepo
- **CSS** : convention BEM stricte (`.block__element--modifier`), Flexbox natif
- **HTML** : HTML sémantique, `<details>/<summary>` pour les accordéons — pas de JS pour le toggle
- **JS** : ES modules natifs (`<script type="module">`), filtrage des événements par attribut `hidden`

## 3. Ce qu'il ne faut pas faire

- Ne pas introduire de framework CSS (Bootstrap, Tailwind…)
- Ne pas introduire de bundler côté site (Webpack, Vite…)
- Ne pas utiliser de classes utilitaires inline — tout CSS passe par `_sass/`
- Ne pas publier de packages npm — ce projet est un site personnel, pas une librairie

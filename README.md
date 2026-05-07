# vtt.bzh — Site Jekyll

Site statique du calendrier des randonnées VTT de Bretagne.

- **URL** : https://vtt.bzh
- **Stack** : Jekyll 4, CSS natif (BEM), Vanilla JS (ES modules)
- **Déploiement** : GitHub Pages via GitHub Actions

---

## Prérequis

- Ruby 4.0.2 (`rbenv` ou `.ruby-version`)
- Bundler : `gem install bundler`
- Les événements sont générés par `jobs/` → `_data/events.yaml`

---

## Développement local

```bash
# Installer les gems
bundle install

# Lancer le serveur avec live reload
bundle exec jekyll serve --livereload

# Build production
bundle exec jekyll build
```

Le site est généré dans `_site/`.

---

## Structure

```
www/
├── _config.yml          # Config Jekyll (url, plugins, pagination…)
├── _data/               # Données YAML injectées dans les templates
│   ├── events.yaml      # Généré par packages/calendar-job (overridé au build CI)
│   ├── authors.yml
│   ├── home.yml
│   └── guides.yml
├── _layouts/            # Layouts Liquid (default, post, archive, landing)
├── _includes/           # Composants réutilisables
│   ├── boxes/           # Cartes (post, guide, card-home, ads)
│   ├── calendar/        # event.html — rendu d'un événement VTT
│   ├── components/      # Boutons, éléments UI atomiques
│   └── plugins/         # commentaires, pagination, share
├── _posts/              # Articles de blog (Markdown)
├── assets/
│   ├── css/main.css     # CSS natif — toutes les sections BEM en un fichier
│   ├── fonts/           # Roboto Condensed (.ttf)
│   └── js/              # Scripts vanilla JS (ES modules)
│       ├── calendar.js  # Filtrage et pagination des événements
│       └── event-form.js # Formulaire public d'ajout (POST direct Supabase REST)
└── index.html           # Page principale — calendrier des randonnées
```

---

## CSS — Conventions BEM

Tout le CSS est écrit en **BEM** (Block Element Modifier) avec **Flexbox natif** dans un seul fichier `assets/css/main.css`. Pas de préprocesseur, pas de framework.

### Règle de nommage

```
.block {}
.block__element {}
.block--modifier {}
.block__element--modifier {}
```

### Structure de `main.css`

Le fichier est organisé en sections commentées dans cet ordre :

| Section       | Blocs                                                      |
| ------------- | ---------------------------------------------------------- |
| Variables     | Custom properties globales (`:root`)                       |
| Document      | `html { font-size: 62.5% }`, `body { font-size: 1.6rem }`  |
| Reset         | box-sizing, img, ul                                        |
| Base          | `@font-face`, html/body, typographie, liens                |
| Layout        | `.container`, `.site-header`, `.site-main`, `.site-footer` |
| Nav           | `.site-nav`                                                |
| Buttons       | `.btn`, `.btn--primary/secondary/outline/light`            |
| Badge         | `.badge`, `.badge--danger/secondary`                       |
| Author        | `.author-box`                                              |
| Event         | `.event` (détails d'une rando)                             |
| Search filter | `.search-filter`                                           |
| Message       | `.message`                                                 |

### Ajouter un nouveau composant

1. Ajouter une section commentée dans `assets/css/main.css`
2. Utiliser les custom properties de `:root` (`--b-color-primary`, `--b-shadow`, etc.)

### Variables disponibles

```css
--b-color-primary: #1c7d44;
--b-color-secondary: #166437;
--b-color-grey-light: #ecf0f1;
--b-color-grey-dark: #333;
--b-color-white: #fff;
--b-color-danger: #dc3545;
--b-color-alert-bg: #f8d7da;
--b-color-alert-text: #721c24;
--b-color-info-bg: #cce5ff;
--b-color-info-text: #004085;
--b-font-heading: "Roboto Condensed", sans-serif;
--b-font-body: "Lato", sans-serif;
--b-container-max: 114rem; /* 1140px */
--b-shadow: 0 0.2rem 0.4rem rgba(0, 0, 0, 0.075);
--b-border-color: #dee2e6;
--b-border-radius: 0.4rem;
```

---

## HTML — Conventions Jekyll / Liquid

- Les **layouts** héritent de `default.html` via `layout: default` en front matter.
- Les **includes** reçoivent leurs données via `include mon-composant.html param=valeur`.
- Les **événements** sont rendus via `{% include calendar/event.html event=event %}`.
- Les pages utilisent du **HTML sémantique natif** : `<details>/<summary>` pour les accordéons, pas de JS pour le toggle.

---

## JS — Conventions

- **ES modules natifs** (`<script type="module">`), pas de bundler.
- Fichiers dans `assets/js/`, servis statiquement par Jekyll.
- `calendar.js` : filtrage et pagination par manipulation de l'attribut `hidden` sur les éléments `<details>` du DOM pré-rendu Jekyll.
- `event-form.js` : soumission du formulaire public sur `/calendrier/ajouter.html` ; POST direct vers Supabase REST avec la clé anon, RLS sécurise (origin contraint à `public-form/%`, UPDATE/DELETE refusés).

---

## Données — `_data/events.json`

Le fichier `_data/events.json` est **généré automatiquement** au build CI par `packages/calendar/generate-events.ts` qui lit la table Supabase `events` (filtrée sur `active=true` et fenêtre [aujourd'hui, +1 an]). Il est présent dans le repo comme **données de test** pour le développement local.

Format d'un événement :

```yaml
- date: "2026-03-29"
  name: "Nom de la rando"
  city: "Ville"
  departement: 56
  hour: "09h00"
  place: "Lieu de RDV"
  organisateur: "Club VTT"
  contact: "contact@club.fr"
  price: "5€"
  canceled: false
  description: "Description optionnelle"
  dateFormatted: "29 mars 2026"
```

---

## TODO (long terme)

- [ ] **Commentaires** : évaluer remplacement de Disqus par [Giscus](https://giscus.app/) (GitHub Discussions, sans tracking, RGPD)
- [ ] **Analytics** : évaluer suppression de Google Tag Manager si inutilisé (le beacon Cloudflare est déjà en place)
- [ ] **Tests** : ajouter un smoke test vitest sur `jobs/` (generate-events-yaml)

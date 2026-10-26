# vtt.bzh — Site Jekyll

Site statique du calendrier des randonnées VTT de Bretagne.

- **URL** : https://vtt.bzh
- **Stack** : Jekyll 4, CSS natif (BEM), Vanilla JS (ES modules)
- **Déploiement** : GitHub Pages via GitHub Actions

---

## Prérequis

- Ruby 4.0.9 (`rbenv` ou `.ruby-version`)
- Bundler : `gem install bundler`
- Les événements sont générés au build par `packages/calendar` dans `_data/events.json` ; ce fichier est privé, ignoré par Git et absent d’un clone neuf.

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
├── _config.yml          # Config Jekyll (url, plugins)
├── _data/               # Données injectées dans les templates
│   └── events.json      # Artefact local/CI, ignoré par Git
├── _layouts/            # Layouts Liquid (default, calendar-page, redirect)
├── _includes/           # Composants réutilisables
│   ├── calendar/        # event.html — rendu d'un événement VTT
│   ├── components/      # Formulaire d’ajout d’une rando
├── _posts/              # Articles de blog (Markdown)
├── assets/
│   ├── css/main.css     # CSS natif — toutes les sections BEM en un fichier
│   ├── fonts/           # Roboto Condensed latin optimisé (.woff2)
│   └── js/              # Scripts vanilla JS (ES modules)
│       ├── calendar.js  # Filtrage et chargement progressif des événements
│       └── event-form.js # Formulaire public vers l'Edge Function contrôlée
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

| Section     | Blocs                                                                           |
| ----------- | ------------------------------------------------------------------------------- |
| Variables   | Custom properties globales (`:root`)                                            |
| Document    | `html { font-size: 62.5% }`, `body { font-size: 1.6rem }`                       |
| Reset       | box-sizing, img, ul                                                             |
| Base        | `@font-face`, html/body, typographie, liens                                     |
| Primitives  | `.icon`, `.avatar`, `.meta`, `.btn`, `.control`, `.field`, `.card`, `.badge`    |
| Layout      | `.container`, `.site-header`, `.site-main`, `.site-footer`                      |
| Navigation  | `.site-nav`, `.tabs`, `.calendar-week-navigation`                               |
| Contenu     | `.publication-card`, `.stat`, `.message`, `.disclosure`                         |
| Calendrier  | `.event`, `.calendar`, `.calendar-day`, `.calendar-empty`, `.organizer-callout` |
| Formulaires | `.search-filter`, `.event-form`, `.newsletter-inline`                           |
| Éditorial   | `.newsletter-prompt`, `.project-signature`, `.faq`, `.fomo`                     |

### Ajouter un nouveau composant

1. Ajouter une section commentée dans `assets/css/main.css`
2. Utiliser les custom properties de `:root` (`--b-color-brand`, `--b-shadow`, etc.)

### Variables disponibles

```css
--b-color-brand: #1c7d44;
--b-color-neutral-0: #fff;
--b-color-neutral-10: #f5f5f5;
--b-color-neutral-20: #ecf0f1;
--b-color-neutral-30: #dee2e6;
--b-color-neutral-40: #d6d8d9;
--b-color-neutral-50: #adb5bd;
--b-color-neutral-60: #676b70;
--b-color-neutral-70: #495057;
--b-color-neutral-80: #343a40;
--b-color-neutral-90: #212529;
--b-color-neutral-100: #000;
--b-color-border: var(--b-color-neutral-30);
--b-color-semantic-alert-0 à --b-color-semantic-alert-100;
--b-color-semantic-info-0 à --b-color-semantic-info-100;
--b-color-semantic-{alert|info}-{background-muted|background-emphasis|border|foreground};
--b-font-heading: "Roboto Condensed", sans-serif;
--b-font-body:
  system-ui, -apple-system, blinkmacsystemfont, "Segoe UI", sans-serif;
--b-container-max: 114rem; /* 1140px */
--b-control-height: 4.4rem;
--b-control-radius: var(--b-size-32);
--b-control-font-size: 1.5rem;
--b-disabled-opacity: 0.8;
--b-shadow: 0 0.2rem 0.4rem rgba(0, 0, 0, 0.075);
--b-border-radius: 0.4rem;
```

Les palettes `--b-color-neutral-*` et `--b-color-semantic-*`, leurs aliases d'usage et `--b-color-border`
appartiennent au Core partagé. Les composants utilisent les aliases sémantiques
(`background-muted`, `background-emphasis`, `border`, `foreground`) plutôt que les niveaux numériques. Seule
`--b-color-brand` reste une couleur propre à vtt.bzh.

Le bouton standard reprend le contrat de `nicolasjouanno.com` : padding `8 × 16`, bordure `1 px`,
rayon `32 px`, texte `15 px` en graisse `700`. `.btn--small` reste l'unique adaptation propre à
vtt.bzh et demeure réservée aux commandes utilitaires des barres sticky. Seule `.btn--brand` est
remplie avec la couleur de marque ; `.btn--dark-outline` et `.btn--light` servent aux actions secondaires.
Ne pas créer d'autre variante de taille locale.

Les contrôles `.control` reprennent la règle de `nicolasjouanno.com` : hauteur minimale de `44 px`,
padding `8 × 16 px`, bordure `1 px`, rayon `32 px`, corps `15 px` et état désactivé à `0.8`. Les champs du
calendrier, des filtres, des formulaires et de la newsletter composent cette primitive au lieu de
redéfinir leur géométrie. `.field` porte uniquement l’empilement, le label et l’aide. Le focus
visible global utilise la marque avec un trait de `2 px`.

Le composant `.card` reprend le contrat de `nicolasjouanno.com`. Toute surface
avec un fond, une bordure, un rayon et un padding compose un skin et une taille :

- skins : `.card--flat`, `.card--neutral`, `.card--brand`, `.card--info`,
  `.card--alert` ;
- bordure renforcée facultative : `.card--outline` ;
- tailles : `.card--small` (`8 px / 4 px`), `.card--medium`
  (`16 px / 8 px`) et `.card--large` (`32 px / 16 px`) ;
- le premier nombre désigne le padding, le second le rayon.

Les variantes `info` et `alert` définissent ensemble le fond, la couleur du
texte et la bordure depuis les aliases sémantiques. Un composant métier, comme
`.event` ou `.newsletter-inline`, ne redéfinit pas ce skin.

Les autres primitives suivent également le contrat de `nicolasjouanno.com` :

- `.icon` mesure `1em`, hérite de `currentColor` et reste décorative avec `aria-hidden` ;
- `.avatar` porte les tailles `small`, `medium`, `large` et `xlarge` ;
- `.meta` porte le texte secondaire en `neutral-60` ;
- `.tabs` porte l’état actif par un soulignement de marque sur une cible minimale de `44 px` ;
- `.disclosure` gouverne les marqueurs de `<details>/<summary>` ;
- `.publication-card` structure une couverture, un repère, un titre, un résumé et ses actions ;
- `.stat` structure les KPI sans leur donner une apparence métier.

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
- `calendar.js` : transforme progressivement la liste statique en planning hebdomadaire, avec douze semaines glissantes, filtre par département et groupe « Plus tard » pour les semaines déjà alimentées au-delà de cet horizon. La semaine et le département restent partageables dans l’URL. Les pages statiques `/calendrier/page/N/` restent utilisables sans JavaScript.
- `event-form.js` : soumet le formulaire public à l'Edge Function `submit-event`. Le navigateur ne peut fixer aucun champ système et conserve les données saisies en cas d'échec.

---

## Données — `_data/events.json` (artefact privé)

Le fichier `_data/events.json` est **généré automatiquement** au build CI par `packages/calendar/generate-events.ts`, qui lit la table Supabase `events`, normalise les données publiques, écarte les doublons certains et contrôle les chutes anormales. Il est ignoré par Git : le dépôt ne contient ni l’agenda courant ni d’échantillon d’événements. Jekyll produit ensuite `/calendrier/events.json` et des pages statiques de 20 événements.

Le premier déploiement de ce format s'appuie sur `packages/calendar/baseline/events-count.json`, capturé depuis la home de production. Dès que `/calendrier/events.json` existe en production, cette source dynamique devient prioritaire. En CI, l'absence des deux baselines ou une baisse supérieure à 50 % bloque le déploiement.

## Données — `_data/newsletters/latest.json` (artefact public)

Le script `scripts/generate-la-sortie.rb` extrait au build le premier élément du flux RSS dédié de
La Sortie. Il ne conserve que son titre, sa description, son URL, sa date et sa couverture, puis
Jekyll rend la carte dans le HTML de la home. Le fichier est ignoré par Git et possède un repli
générique : la disponibilité de la publication éditoriale ne peut pas bloquer le calendrier.

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

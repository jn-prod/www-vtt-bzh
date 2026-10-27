# Matière calendrier — La Sortie

Ce dossier contient les briefs factuels issus du calendrier vtt.bzh. Jekyll ne les
publie pas tant qu'ils restent dans `_drafts/`.

## Générer un brief

Le workflow « Brief La Sortie » (`.github/workflows/brief-la-sortie.yml`) tourne seul le
15 de chaque mois pour l'édition du mois suivant : du 1er au 1er + 35 jours. À la main :
onglet Actions, dates vides pour cette même fenêtre, ou une autre fenêtre. Il génère le
brief, contrôle la confidentialité et le commite ici.

En local, à la racine de vtt.bzh :

```sh
pnpm newsletter:new -- --start=YYYY-MM-DD --end=YYYY-MM-DD
```

Les deux dates sont inclusives. Le script charge le `.env` racine, lit les événements
publics Supabase et crée `YYYY-MM-DD_YYYY-MM-DD-la-sortie.md`. Ajouter `--update` (case
« Réécrire » dans le workflow) pour régénérer le même brief.

## Utiliser le brief

Le brief est une matière de sélection : volumes, départements, agenda par week-end et
nouveautés récentes. Il ne constitue ni une newsletter prête à envoyer ni un contenu
à publier tel quel. Reprendre uniquement les faits vérifiés dans le brouillon
éditorial de nj.com.

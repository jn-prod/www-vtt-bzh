# Supabase

Configuration Supabase pour vtt.bzh.

## Migrations

Le dossier `migrations/` versionne les changements de schéma et de policies à appliquer via le dashboard Supabase (SQL Editor) avec la clé `service_role`.

| Fichier                   | Contexte                                                                                                                                                    | À appliquer manuellement             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `20260505_rls_events.sql` | RLS sur `events` (anon : SELECT actifs + INSERT contraint à `public-form/%`, UPDATE/DELETE refusés). Cohérent avec D-2026-05-05-002 (stabilisation-source). | ✅ avant T-015 (formulaire Supabase) |

## Stratégie de modération

**A posteriori, par email** :

- Les inserts via le formulaire public sont `active=true` par défaut → visibilité immédiate.
- Une notif email part à chaque insert (T-016) → modérateur reçoit le contenu.
- Si non conforme : modérateur passe `active=false` via dashboard Supabase → l'event disparaît instantanément du site (filtré par RLS et par `generate-events.ts`).

UPDATE/DELETE anon sont strictement refusés : un spammer ne peut qu'ajouter, jamais altérer/effacer les events validés.

## Application d'une migration

1. Ouvrir https://supabase.com/dashboard → projet vtt.bzh.
2. SQL Editor → New query.
3. Coller le contenu de la migration → Run.
4. Vérifier dans Authentication → Policies que les policies attendues sont présentes.

## Edge functions

Voir `functions/` (T-016 à venir : notif email modération via Resend).

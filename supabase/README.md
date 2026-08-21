# Supabase

Configuration Supabase pour vtt.bzh.

## Changements de schéma

Le dossier `migrations/` contient l'historique déjà public. Les nouveaux changements distants sont appliqués via le dashboard ou le PAC du studio, puis consignés dans le journal quotidien ; aucun secret ni nouveau fichier SQL de production n'est ajouté ici par défaut.

| Fichier                   | Contexte                                                                                                                                                                | À appliquer manuellement |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `20260505_rls_events.sql` | Ancienne politique de soumission directe, conservée comme historique. Elle est remplacée en production par `submit-event` et l'absence d'`INSERT` anonyme sur `events`. | Historique               |

## Stratégie de modération

**A posteriori, par email** :

- `submit-event` valide la requête, limite le débit et fixe les champs système avant insertion.
- Les événements valides sont `active=true` par défaut, puis apparaissent lors du build quotidien suivant.
- Une notif email part à chaque insert (T-016) → modérateur reçoit le contenu.
- Si non conforme : modérateur passe `active=false` via dashboard Supabase → l'event disparaît instantanément du site (filtré par RLS et par `generate-events.ts`).

`INSERT`, `UPDATE` et `DELETE` anonymes sont refusés sur `events`. Seule l'Edge Function écrit avec sa clé serveur.

## Vérification d'un changement distant

1. Ouvrir https://supabase.com/dashboard → projet vtt.bzh.
2. Vérifier le schéma et les politiques RLS dans Database.
3. Vérifier la version et les secrets de l'Edge Function sans exposer leur valeur.
4. Tester CORS, validation, limitation de débit et absence d'écriture anonyme directe.

## Edge functions

- `submit-event` : endpoint public contrôlé, validation stricte, limitation de débit persistante et insertion serveur.
- `notify-new-event` : notification de modération déclenchée après insertion.

`submit-event` utilise la clé secrète moderne nommée `submit_event`, fournie automatiquement dans `SUPABASE_SECRET_KEYS`. La table `event_submission_attempts` stocke uniquement une empreinte HMAC pendant environ 24 heures, avec RLS active et aucun droit `anon` ou `authenticated`. Une tâche `pg_cron` exécutée chaque minute supprime les lignes de plus de 24 heures ; la fonction conserve aussi une purge opportuniste. Le seuil est de 5 tentatives par fenêtre glissante de 15 minutes et par empreinte.

Le formulaire accepte JSON avec JavaScript et `application/x-www-form-urlencoded` sans JavaScript. Une soumission HTML valide reçoit une redirection `303` vers la confirmation locale ; l'adresse email n'est jamais placée dans l'URL.

Le 2026-08-19, les fonctions trigger ont été durcies : aucun `EXECUTE` pour `anon` ou `authenticated`, et `update_updated_at_column` utilise un `search_path` fixé. Les advisors ne remontent plus d'exposition publique de fonction `SECURITY DEFINER`.

## Tracking soutien

Les clics vers Tipeee sont insérés côté navigateur dans `support_events` via REST Supabase avec la clé publishable et `fetch(..., { keepalive: true })`. Le payload est volontairement limité à `provider`, `placement`, `href` et `path`; aucune donnée personnelle, cookie, user-agent, referrer complet ou identifiant utilisateur n'est collecté par le script local.

La table `support_events` a été configurée directement dans Supabase le 2026-05-08 via le PAC du projet, avec RLS `anon INSERT` uniquement et aucun accès public `SELECT`, `UPDATE` ou `DELETE`.

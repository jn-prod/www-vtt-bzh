-- Migration : durcissement RLS sur public.events
-- Contexte : D-2026-05-05-002 (stabilisation-source).
-- Stratégie de modération retenue : insert direct + visibilité immédiate (active=true par défaut)
-- + notif email à chaque insert pour modération a posteriori (T-016).
-- À appliquer via Supabase Dashboard → SQL Editor (clé service_role nécessaire).

-- 1. Activer RLS
alter table public.events enable row level security;

-- 2. Drop policies existantes (idempotence)
drop policy if exists "events_anon_select" on public.events;
drop policy if exists "events_anon_insert_public_form" on public.events;
drop policy if exists "events_service_full" on public.events;

-- 3. SELECT pour anon : uniquement les events actifs.
--    Cohérent avec generate-events.ts:34 (filtre active=true au build).
--    Effet : un event passé à active=false par modération disparaît immédiatement de la table publique
--    et donc du prochain build.
create policy "events_anon_select"
  on public.events
  for select
  to anon
  using (active = true);

-- 4. INSERT pour anon : autorisé pour les soumissions du formulaire public.
--    - origin LIKE 'public-form/%' : traçabilité de la source.
--    - active autorisé à true (visibilité immédiate, modération a posteriori par email).
--    - lock=false et canceled=false : interdit aux clients de bypasser la logique app.
--    Le runner Wufoo (origin 'form/%') ne pourra plus insérer via anon — c'est volontaire,
--    packages/form sera supprimé en T-017 et ne tournera plus.
create policy "events_anon_insert_public_form"
  on public.events
  for insert
  to anon
  with check (
    origin like 'public-form/%'
    and (lock is null or lock = false)
    and (canceled is null or canceled = false)
  );

-- 5. service_role conserve l'accès complet (dashboard, migrations, modération via UI Supabase)
create policy "events_service_full"
  on public.events
  for all
  to service_role
  using (true)
  with check (true);

-- 6. UPDATE / DELETE anon : aucune policy → refusés par défaut sous RLS active.
--    Important : un spammer ne peut pas altérer/effacer les events validés, seulement en ajouter.
--    La modération (passage à active=false) se fait via le dashboard avec service_role.

-- Vérification post-application avec la clé anon (curl) :
--   SELECT count(*) FROM events WHERE active=true     → 200 OK
--   SELECT * FROM events WHERE active=false           → 200 OK mais 0 ligne (filtré par RLS)
--   INSERT (origin='public-form/x', active=true)      → 201
--   INSERT (origin='form/y')                          → 401/403 (origin non conforme)
--   INSERT (origin='public-form/x', lock=true)        → 401/403 (lock interdit)
--   UPDATE                                            → 401/403
--   DELETE                                            → 401/403

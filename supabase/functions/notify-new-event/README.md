# notify-new-event

Edge Function Supabase. À chaque INSERT dans `public.events` avec `origin LIKE 'public-form/%'`, envoie un email au modérateur via Resend.

## Architecture

```
[formulaire ajouter.html]
    │ POST /rest/v1/events  (clé anon, RLS)
    ▼
[table public.events]   ── INSERT trigger ──▶  [Database Webhook Supabase]
                                                       │ POST + x-webhook-secret
                                                       ▼
                                          [Edge Function notify-new-event]
                                                       │ POST /emails
                                                       ▼
                                                  [Resend API]
                                                       │
                                                       ▼
                                       me@nicolasjouanno.com
```

## Pré-requis (action humaine)

1. **Compte Resend** (gratuit, https://resend.com) → créer un projet → noter la **API Key**.
2. **Vérifier domain** dans Resend (optionnel mais recommandé pour ne pas tomber en spam) ; sinon utiliser `onboarding@resend.dev` qui n'envoie qu'à l'adresse du compte Resend (= `me@nicolasjouanno.com` à condition que ce soit l'adresse du compte).
3. **Supabase CLI** installé localement : `brew install supabase/tap/supabase` ou voir https://supabase.com/docs/guides/cli.

## Déploiement

```bash
cd /root/www-vtt-bzh
supabase login
supabase link --project-ref lbqjpwsifmmzxafkbcvz
supabase secrets set \
  RESEND_API_KEY=re_xxx \
  WEBHOOK_SECRET=$(openssl rand -hex 24) \
  MODERATOR_EMAIL=me@nicolasjouanno.com \
  NOTIFY_FROM='vtt.bzh <onboarding@resend.dev>'
supabase functions deploy notify-new-event --no-verify-jwt
```

> `--no-verify-jwt` est nécessaire car le webhook Supabase n'envoie pas de JWT. La sécurité est assurée par le header `x-webhook-secret` validé côté function.

## Configuration du webhook (dashboard Supabase)

1. Dashboard → **Database** → **Webhooks** → **Create a new hook**.
2. Name : `notify-new-event`.
3. Table : `public.events`.
4. Events : ☑ INSERT (uniquement).
5. Type : `Supabase Edge Functions` → `notify-new-event`.
6. HTTP Headers : ajouter `x-webhook-secret` = la valeur posée dans `WEBHOOK_SECRET` à l'étape précédente.
7. **Save**.

## Test

Insérer une entry de test via curl avec la clé anon :

```bash
curl -X POST "$SUPABASE_URL/rest/v1/events" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"TEST notif",
    "date":"2099-12-31",
    "hour":"00h00",
    "city":"Pontivy",
    "departement":56,
    "organisateur":"Test",
    "contact":"test@example.com",
    "kind":"vtt",
    "origin":"public-form/test-notif"
  }'
```

Un email doit arriver sur `MODERATOR_EMAIL` dans la minute. Logs côté `supabase functions logs notify-new-event`.

Cleanup :

```bash
curl -X DELETE "$SUPABASE_URL/rest/v1/events?origin=eq.public-form/test-notif" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

(Le DELETE anon est refusé par RLS — passer par le dashboard ou la `service_role` key.)

## Comportement

- INSERT autre que `events` ou `origin` non `public-form/%` → réponse 200 mais pas d'email (filtre côté function).
- Header `x-webhook-secret` invalide → 401.
- Resend down → 502, le webhook Supabase peut être configuré pour retry.

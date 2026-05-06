# notify-new-event

Edge Function Supabase. À chaque INSERT dans `public.events` avec `origin LIKE 'public-form/%'`, envoie un message Telegram au modérateur via le bot configuré.

## Architecture

```
[formulaire ajouter.html]
    │ POST /rest/v1/events  (clé anon, RLS)
    ▼
[table public.events]   ── INSERT trigger ──▶  [Database Webhook Supabase]
                                                       │ POST + x-webhook-secret
                                                       ▼
                                          [Edge Function notify-new-event]
                                                       │ POST /sendMessage
                                                       ▼
                                            [Telegram Bot API]
                                                       │
                                                       ▼
                                          chat Telegram du modérateur
```

## Pré-requis (action humaine, ~5 min)

1. **Créer un bot Telegram** :
   - Sur Telegram, ouvrir `@BotFather`, envoyer `/newbot`.
   - Choisir un nom (ex `vtt.bzh moderation`) et un username (ex `vttbzh_moderation_bot`).
   - Copier le token retourné (format `1234567890:AAH…`) — c'est `TELEGRAM_BOT_TOKEN`.
2. **Activer la conversation** :
   - Cliquer le lien `t.me/<username>` retourné par BotFather.
   - Envoyer `/start` au bot.
3. **Récupérer le `TELEGRAM_CHAT_ID`** :
   - Ouvrir `https://api.telegram.org/bot<TOKEN>/getUpdates` dans un navigateur.
   - Récupérer `result[0].message.chat.id` (entier — positif pour DM, négatif pour group/channel).
4. **Supabase CLI** installée (la procédure d'Étape 9 du plan l'installe localement via `pnpm add -D -w supabase`).

## Déploiement

```bash
cd /root/www-vtt-bzh
# Auth non-interactive via PAT Supabase
export SUPABASE_ACCESS_TOKEN=sbp_xxx
export SUPABASE_PROJECT_REF=lbqjpwsifmmzxafkbcvz

# Set secrets côté edge function
pnpm exec supabase secrets set --project-ref ${SUPABASE_PROJECT_REF} \
  TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN}" \
  TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID}" \
  WEBHOOK_SECRET="$(openssl rand -hex 24)"

# Deploy
pnpm exec supabase functions deploy notify-new-event \
  --project-ref ${SUPABASE_PROJECT_REF} \
  --no-verify-jwt
```

> `--no-verify-jwt` est nécessaire car le webhook Supabase n'envoie pas de JWT. La sécurité est assurée par le header `x-webhook-secret` validé côté function.

## Configuration du webhook (dashboard Supabase ou Management API)

Via dashboard :

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

Un message Telegram doit arriver sur le chat du bot dans la minute. Logs côté `pnpm exec supabase functions logs notify-new-event`.

Cleanup via dashboard Supabase (anon ne peut pas DELETE sous RLS).

## Comportement

- INSERT autre que `events` ou `origin` non `public-form/%` → réponse 200 mais pas de notif (filtre côté function).
- Header `x-webhook-secret` invalide → 401.
- Telegram down → 502, le webhook Supabase peut être configuré pour retry.

## Format du message

Message HTML court (truncaté à ~3500 caractères pour respecter la limite Telegram de 4096), avec :

- Nom de la rando (en gras)
- Date / heure / ville / département
- Lieu RDV, organisateur, contact, lien, prix (si renseignés)
- Description en italique
- ID + origin en monospace
- Lien vers le dashboard Supabase pour modération en 1 clic

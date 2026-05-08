// support-tracking.js — suivi anonyme des clics sortants vers Tipeee.
// Pas de cookie, pas d'identifiant utilisateur, pas de fingerprint.
// Supabase REST exige des en-têtes d'auth ; fetch keepalive est donc utilisé.

const SCRIPT = document.currentScript;
const SUPABASE_URL = SCRIPT?.dataset.supabaseUrl || "";
const SUPABASE_KEY = SCRIPT?.dataset.supabaseKey || "";
const SUPPORT_EVENTS_TABLE = SCRIPT?.dataset.supportEventsTable || "";
const TRACK_SELECTOR = 'a[data-track="support-click"]';

const postEvent = (payload) => {
  if (!SUPABASE_URL || !SUPABASE_KEY || !SUPPORT_EVENTS_TABLE) return;

  const endpoint = `${SUPABASE_URL}/rest/v1/${SUPPORT_EVENTS_TABLE}`;
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  const body = JSON.stringify(payload);

  fetch(endpoint, {
    method: "POST",
    headers,
    body,
    keepalive: true,
  }).catch(() => {});
};

const buildPayload = (link) => ({
  provider: link.dataset.supportProvider || "tipeee",
  placement: link.dataset.supportPlacement || "unknown",
  href: link.href,
  path: window.location.pathname,
});

document.addEventListener(
  "click",
  (event) => {
    const link = event.target.closest?.(TRACK_SELECTOR);
    if (!link) return;

    postEvent(buildPayload(link));
  },
  { capture: true },
);

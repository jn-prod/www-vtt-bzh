// event-form.js — soumission du formulaire d'ajout de rando vers Supabase REST.
// Stack : ES module natif (pas de bundler), fetch natif, crypto.randomUUID natif.
// Sécurité : clé anon publique par design ; RLS Supabase impose origin=public-form/% et refuse UPDATE/DELETE.

const SUPABASE = window.__SUPABASE__ || {};
const FORM_ID = "event-form";
const FEEDBACK_ID = "event-form-feedback";
const HONEYPOT_FIELD = "website_url";

const SUCCESS_MSG =
  "Merci, votre rando est publiée. Elle apparaîtra sur le calendrier au prochain rafraîchissement.";
const ERROR_MSG =
  "Désolé, l’envoi a échoué. Réessayez dans un instant ou contactez nicolas@vtt.bzh.";
const HONEYPOT_MSG = "Envoi rejeté (anti-spam).";

const onReady = (cb) =>
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", cb, { once: true })
    : cb();

// Messages de validation HTML5 en français — RGAA 11.11.
const INVALID_MESSAGES_FR = {
  valueMissing: "Veuillez remplir ce champ.",
  typeMismatch: "Le format saisi n’est pas valide.",
  patternMismatch: "Le format demandé n’est pas respecté.",
  tooShort: "La saisie est trop courte.",
  tooLong: "La saisie est trop longue.",
  rangeUnderflow: "La valeur est trop petite.",
  rangeOverflow: "La valeur est trop grande.",
  stepMismatch: "La valeur ne respecte pas l’incrément attendu.",
  badInput: "La saisie n’est pas valide.",
};

const setFrenchValidationMessage = (field) => {
  field.setCustomValidity("");
  if (field.validity.valid) return;
  if (field.type === "checkbox" && field.validity.valueMissing) {
    field.setCustomValidity("Veuillez cocher cette case.");
    return;
  }
  for (const key of Object.keys(INVALID_MESSAGES_FR)) {
    if (field.validity[key]) {
      field.setCustomValidity(INVALID_MESSAGES_FR[key]);
      return;
    }
  }
};

const wireFrenchValidation = (form) => {
  form.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("invalid", () => setFrenchValidationMessage(field));
    field.addEventListener("input", () => field.setCustomValidity(""));
    field.addEventListener("change", () => field.setCustomValidity(""));
  });
};

const setFeedback = (el, kind, message) => {
  el.textContent = message;
  el.className = `event-form__feedback event-form__feedback--${kind}`;
};

const buildPayload = (formData) => {
  const get = (k) => {
    const v = formData.get(k);
    return typeof v === "string" ? v.trim() : "";
  };
  const departementRaw = get("departement");
  return {
    name: get("name"),
    date: get("date"),
    hour: get("hour"),
    city: get("city"),
    departement: departementRaw ? Number(departementRaw) : null,
    place: get("place") || null,
    organisateur: get("organisateur"),
    price: get("price") || null,
    website: get("website") || null,
    contact: get("contact"),
    description: get("description") || null,
    kind: "vtt",
    origin: `public-form/${crypto.randomUUID()}`,
  };
};

const submit = async (payload) => {
  if (!SUPABASE.url || !SUPABASE.key || !SUPABASE.table) {
    throw new Error("Supabase config missing");
  }
  const res = await fetch(`${SUPABASE.url}/rest/v1/${SUPABASE.table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE.key,
      Authorization: `Bearer ${SUPABASE.key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Supabase ${res.status} — ${detail.slice(0, 200)}`);
  }
};

onReady(() => {
  const form = document.getElementById(FORM_ID);
  const feedback = document.getElementById(FEEDBACK_ID);
  if (!form || !feedback) return;

  wireFrenchValidation(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    feedback.textContent = "";

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);

    if ((formData.get(HONEYPOT_FIELD) || "").toString().length > 0) {
      setFeedback(feedback, "error", HONEYPOT_MSG);
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const previousLabel = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Envoi en cours…";
    }
    setFeedback(feedback, "pending", "Envoi en cours…");

    try {
      await submit(buildPayload(formData));
      setFeedback(feedback, "success", SUCCESS_MSG);
      form.reset();
    } catch (err) {
      console.error("[event-form] submit failed", err);
      setFeedback(feedback, "error", ERROR_MSG);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        if (previousLabel) submitBtn.textContent = previousLabel;
      }
    }
  });
});

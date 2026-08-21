const CONFIG = window.__EVENT_SUBMISSION__ || {};
const FORM_ID = "event-form";
const FEEDBACK_ID = "event-form-feedback";
const HONEYPOT_FIELD = "website_url";
const NEWSLETTER_ENDPOINT = "https://app.kit.com/forms/9677378/subscriptions";

const SUCCESS_MESSAGE =
  "Merci, votre rando est enregistrée. Après validation automatique, elle sera publiée au prochain rafraîchissement quotidien.";
const ERROR_MESSAGE =
  "Désolé, l’envoi a échoué. Vos informations sont conservées : réessayez ou contactez nicolas@vtt.bzh.";

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

const dateToISO = (date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .split("T")[0];

const configureDateRange = (form) => {
  const field = form.elements.namedItem("date");
  if (!(field instanceof HTMLInputElement)) return;
  const today = new Date();
  const maximum = new Date(today);
  maximum.setDate(maximum.getDate() + 365);
  field.min = dateToISO(today);
  field.max = dateToISO(maximum);
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

const setFeedback = (element, kind, message) => {
  element.textContent = message;
  element.className = `event-form__feedback event-form__feedback--${kind}`;
};

const buildPayload = (formData) => {
  const get = (key) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  return {
    name: get("name"),
    date: get("date"),
    hour: get("hour"),
    city: get("city"),
    departement: Number(get("departement")),
    place: get("place"),
    organisateur: get("organisateur"),
    price: get("price"),
    website: get("website"),
    email: get("email"),
    phone: get("phone"),
    description: get("description"),
    consent: formData.get("consent") === "on",
    website_url: get(HONEYPOT_FIELD),
  };
};

const subscribeNewsletter = (email) => {
  if (!email) return;
  fetch(NEWSLETTER_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email_address: email }).toString(),
    keepalive: true,
  }).catch(() => {});
};

const submit = async (payload) => {
  if (!CONFIG.endpoint) throw new Error("submission endpoint missing");
  const response = await fetch(CONFIG.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(`submission failed with ${response.status}`);
    error.fields = body.fields;
    error.status = response.status;
    throw error;
  }
};

const showServerErrors = (form, fields) => {
  if (!fields || typeof fields !== "object") return false;
  let first;
  for (const [name, message] of Object.entries(fields)) {
    const field = form.elements.namedItem(name);
    if (
      !(field instanceof HTMLElement) ||
      typeof field.setCustomValidity !== "function"
    )
      continue;
    field.setCustomValidity(String(message));
    first ||= field;
  }
  first?.reportValidity();
  first?.focus();
  return Boolean(first);
};

const wireShare = () => {
  const button = document.getElementById("event-form-share-copy");
  const input = document.getElementById("event-form-share-url");
  if (
    !(button instanceof HTMLButtonElement) ||
    !(input instanceof HTMLInputElement)
  )
    return;
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(input.value);
      button.textContent = "Copié !";
      window.setTimeout(() => {
        button.textContent = "Copier le lien";
      }, 2000);
    } catch {
      input.select();
      input.focus();
    }
  });
};

const form = document.getElementById(FORM_ID);
const feedback = document.getElementById(FEEDBACK_ID);

if (form instanceof HTMLFormElement && feedback instanceof HTMLElement) {
  wireFrenchValidation(form);
  configureDateRange(form);
  wireShare();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    feedback.textContent = "";
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const previousLabel = submitButton?.textContent;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Envoi en cours…";
    }
    setFeedback(feedback, "pending", "Envoi en cours…");

    try {
      await submit(buildPayload(formData));
      if (formData.get("newsletter"))
        subscribeNewsletter(String(formData.get("email") ?? "").trim());
      setFeedback(feedback, "success", SUCCESS_MESSAGE);
      form.reset();
      configureDateRange(form);
      const share = document.getElementById("event-form-share");
      if (share) share.hidden = false;
    } catch (error) {
      console.error("[event-form] submit failed", error);
      const hasFieldError = showServerErrors(form, error.fields);
      setFeedback(
        feedback,
        "error",
        hasFieldError
          ? "Corrigez les champs indiqués puis renvoyez le formulaire."
          : ERROR_MESSAGE,
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        if (previousLabel) submitButton.textContent = previousLabel;
      }
    }
  });
}

const MAIN_WEEK_COUNT = 12;
const DAYS_PER_WEEK = 7;
const DAY_IN_MILLISECONDS = 86_400_000;
const DEPARTEMENTS = {
  22: "les Côtes-d’Armor",
  29: "le Finistère",
  35: "l’Ille-et-Vilaine",
  44: "la Loire-Atlantique",
  56: "le Morbihan",
};

const filterDetails = document.getElementById("filter-details");
const form = document.getElementById("search-form");
const departementSelect = document.getElementById("departement");
const calendarContent = document.getElementById("calendar-content");
const weekNavigation = document.getElementById("calendar-week-navigation");
const weekSelect = document.getElementById("week-select");
const previousWeekButton = document.getElementById("previous-week");
const nextWeekButton = document.getElementById("next-week");
const pagination = document.getElementById("calendar-pagination");
const resultsCount = document.getElementById("results-count");
const resultsLabel = document.getElementById("results-label");
const resultsMessage = document.getElementById("msg-results");
const newsletterPromptTemplate = document.getElementById(
  "newsletter-prompt-template",
);
const organizerCalloutTemplate = document.getElementById(
  "organizer-callout-template",
);

const dateFromISO = (value) => new Date(`${value}T12:00:00Z`);
const dateToISO = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) =>
  new Date(date.getTime() + days * DAY_IN_MILLISECONDS);

const todayInBrittany = () => {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Paris",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
};

const startOfWeek = (value) => {
  const date = typeof value === "string" ? dateFromISO(value) : value;
  const day = date.getUTCDay() || DAYS_PER_WEEK;
  return dateToISO(addDays(date, 1 - day));
};

const weekEnd = (week) => addDays(dateFromISO(week), DAYS_PER_WEEK - 1);

const compactDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const fullDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const dayFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  timeZone: "UTC",
});
const dayNumberFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  timeZone: "UTC",
});

const formatWeek = (week) => {
  const start = dateFromISO(week);
  const end = weekEnd(week);
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const startLabel = sameYear
    ? compactDateFormatter.format(start)
    : fullDateFormatter.format(start);
  return `${startLabel} – ${fullDateFormatter.format(end)}`;
};

const addText = (parent, text, className) => {
  const element = document.createElement("span");
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
};

const addIcon = (parent, name) => {
  const wrapper = document.createElement("span");
  wrapper.className = `icon icon--${name}`;
  wrapper.setAttribute("aria-hidden", "true");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("focusable", "false");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `#icon-${name}`);
  svg.append(use);
  wrapper.append(svg);
  parent.append(wrapper);
};

const safeWebsite = (value) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

const addDetail = (list, label, value) => {
  const item = document.createElement("li");
  item.className = "event__detail";
  addText(item, `${label} :`, "u-font-weight-bold");
  item.append(document.createTextNode(` ${value || "Non renseigné"}`));
  list.append(item);
};

const addContact = (list, event) => {
  const item = document.createElement("li");
  item.className = "event__detail";
  addText(item, "Contact :", "u-font-weight-bold");
  item.append(document.createTextNode(" "));

  if (event.email) {
    const email = document.createElement("a");
    email.href = `mailto:${event.email}`;
    email.textContent = event.email;
    item.append(email);
  }
  if (event.email && event.phone) item.append(document.createTextNode(" — "));
  if (event.phone) {
    const phone = document.createElement("a");
    phone.href = `tel:${event.phone.replaceAll(" ", "")}`;
    phone.textContent = event.phone;
    item.append(phone);
  }
  if (!event.email && !event.phone)
    item.append(document.createTextNode("Non renseigné"));
  list.append(item);
};

const createEvent = (event) => {
  const item = document.createElement("li");
  const details = document.createElement("details");
  details.id = event.id;
  details.className = `event disclosure card card--medium ${
    event.canceled ? "card--alert" : "card--flat"
  }`;
  details.dataset.date = event.date;
  details.dataset.departement = String(event.departement);

  const summary = document.createElement("summary");
  summary.className =
    "event__summary disclosure__summary disclosure__summary--indicator";
  const summaryContent = document.createElement("span");
  summaryContent.className = "event__summary-content";
  addText(summaryContent, event.name, "event__name u-h3");

  const meta = addText(summaryContent, "", "event__meta");
  const location = addText(meta, "", "event__meta-item");
  addIcon(location, "pin");
  addText(location, `${event.city} (${event.departement})`, "event__location");
  if (event.canceled) addText(location, "Annulée", "badge badge--alert");
  summary.append(summaryContent);
  details.append(summary);

  const body = document.createElement("div");
  body.className = "event__body";
  if (event.description) {
    const description = document.createElement("p");
    description.className = "event__description";
    description.textContent = event.description;
    body.append(description);
  }

  const list = document.createElement("ul");
  list.className = "event__details";
  addDetail(list, "Organisateur", event.organisateur);
  addDetail(list, "Horaires", event.hour);
  addDetail(list, "Lieu de rendez-vous", event.place);
  addContact(list, event);
  addDetail(list, "Prix", event.price);
  body.append(list);

  const website = safeWebsite(event.website);
  if (website && !event.canceled) {
    const action = document.createElement("p");
    action.className = "event__action";
    const link = document.createElement("a");
    link.className = "btn btn--brand";
    link.href = website;
    link.target = "_blank";
    link.rel = "noopener noreferrer nofollow ugc";
    link.textContent = "Informations et inscription";
    action.append(link);
    body.append(action);
  }

  details.append(body);
  item.append(details);
  return item;
};

const createNewsletterPrompt = () => {
  const prompt =
    newsletterPromptTemplate?.content.firstElementChild?.cloneNode(true);
  if (!prompt) return null;
  prompt.removeAttribute("data-newsletter-prompt");
  return prompt;
};

const createOrganizerCallout = () =>
  organizerCalloutTemplate?.content.firstElementChild?.cloneNode(true) ?? null;

const createPlanning = (events, week) => {
  const planning = document.createElement("div");
  planning.className = "calendar-planning";
  const title = document.createElement("h2");
  title.className = "u-sr-only";
  title.textContent = `Randonnées de la semaine du ${formatWeek(week)}`;
  planning.append(title);

  const byDate = new Map();
  for (const event of events) {
    const dateEvents = byDate.get(event.date) ?? [];
    dateEvents.push(event);
    byDate.set(event.date, dateEvents);
  }

  let eventIndex = 0;
  for (const [date, dateEvents] of byDate) {
    const section = document.createElement("section");
    section.className = "calendar-day";
    const heading = document.createElement("h3");
    heading.className = "calendar-day__date";
    const time = document.createElement("time");
    time.dateTime = date;
    addText(
      time,
      dayFormatter.format(dateFromISO(date)),
      "calendar-day__weekday",
    );
    addText(
      time,
      dayNumberFormatter.format(dateFromISO(date)),
      "calendar-day__number",
    );
    heading.append(time);
    section.append(heading);

    const list = document.createElement("ul");
    list.className = "calendar-day__events";
    for (const event of dateEvents) {
      list.append(createEvent(event));
      eventIndex += 1;
      if (eventIndex === 5 && events.length > 5) {
        const prompt = createNewsletterPrompt();
        if (prompt) list.append(prompt);
      }
    }
    section.append(list);
    planning.append(section);
  }
  return planning;
};

const createEmptyWeek = (week, departement) => {
  const section = document.createElement("section");
  section.className = "calendar-empty card card--neutral card--medium";
  const title = document.createElement("h2");
  title.className = "calendar-empty__title";
  const location = DEPARTEMENTS[departement];
  title.textContent = location
    ? `Aucune rando annoncée dans ${location} cette semaine`
    : "Aucune rando annoncée cette semaine";
  section.append(title);

  const period = document.createElement("p");
  period.className = "calendar-empty__period";
  period.textContent = formatWeek(week);
  section.append(period);

  const text = document.createElement("p");
  text.className = "calendar-empty__text";
  text.textContent =
    "Chaque mois, La Sortie partage une photo, un vécu et ce qui mérite l’attention dehors : une sortie, une idée, du matériel ou les nouvelles des chemins bretons.";
  section.append(text);

  const actions = document.createElement("div");
  actions.className = "calendar-empty__actions";
  const newsletter = document.createElement("a");
  newsletter.className = "btn btn--brand";
  newsletter.href = "#newsletter";
  newsletter.textContent = "Recevoir La Sortie";
  actions.append(newsletter);
  section.append(actions);
  return section;
};

const createWeekOption = (week, count) => {
  const option = document.createElement("option");
  option.value = week;
  option.textContent = `${formatWeek(week)} · ${count === 0 ? "aucune annonce" : `${count} rando${count > 1 ? "s" : ""}`}`;
  return option;
};

const initTabs = () => {
  const tabs = [...document.querySelectorAll(".tabs__tab")];
  if (!tabs.length || !("IntersectionObserver" in window)) return;
  const byId = Object.fromEntries(
    tabs.map((tab) => [tab.getAttribute("href").slice(1), tab]),
  );
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        tabs.forEach((tab) => tab.classList.remove("is-active"));
        byId[entry.target.id]?.classList.add("is-active");
      }
    },
    { rootMargin: "-30% 0px -60% 0px" },
  );
  Object.keys(byId).forEach((id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
};

const initCalendar = async () => {
  if (
    !calendarContent ||
    !form ||
    !weekNavigation ||
    !weekSelect ||
    !previousWeekButton ||
    !nextWeekButton
  )
    return;

  const today = todayInBrittany();
  const currentWeek = startOfWeek(today);
  const mainWeeks = Array.from({ length: MAIN_WEEK_COUNT }, (_, index) =>
    dateToISO(addDays(dateFromISO(currentWeek), index * DAYS_PER_WEEK)),
  );
  const horizonEnd = dateToISO(
    addDays(dateFromISO(currentWeek), MAIN_WEEK_COUNT * DAYS_PER_WEEK),
  );
  let allEvents;
  let selectedWeek = currentWeek;
  let displayedWeeks = mainWeeks;

  const readURL = () => {
    const parameters = new URLSearchParams(window.location.search);
    const departement = parameters.get("departement");
    if (
      departementSelect &&
      (departement === "all" || DEPARTEMENTS[departement])
    )
      departementSelect.value = departement;
    selectedWeek = /^\d{4}-\d{2}-\d{2}$/u.test(parameters.get("week") ?? "")
      ? startOfWeek(parameters.get("week"))
      : currentWeek;
  };

  const filteredEvents = () => {
    const departement = departementSelect?.value ?? "all";
    return allEvents.filter(
      (event) =>
        event.date >= today &&
        (departement === "all" || String(event.departement) === departement),
    );
  };

  const weeksFor = (events) => {
    const distantWeeks = [
      ...new Set(
        events
          .filter((event) => event.date >= horizonEnd)
          .map((event) => startOfWeek(event.date)),
      ),
    ].sort();
    return [...mainWeeks, ...distantWeeks];
  };

  const updateURL = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("week", selectedWeek);
    const departement = departementSelect?.value ?? "all";
    if (departement === "all") url.searchParams.delete("departement");
    else url.searchParams.set("departement", departement);
    window.history.pushState({}, "", url);
  };

  const render = () => {
    const events = filteredEvents();
    displayedWeeks = weeksFor(events);
    if (!displayedWeeks.includes(selectedWeek)) selectedWeek = currentWeek;

    const counts = new Map(displayedWeeks.map((week) => [week, 0]));
    for (const event of events) {
      const week = startOfWeek(event.date);
      if (counts.has(week)) counts.set(week, counts.get(week) + 1);
    }

    const mainGroup = document.createElement("optgroup");
    mainGroup.label = "Prochaines semaines";
    for (const week of mainWeeks)
      mainGroup.append(createWeekOption(week, counts.get(week) ?? 0));
    const options = [mainGroup];
    const distantWeeks = displayedWeeks.filter((week) => week >= horizonEnd);
    if (distantWeeks.length > 0) {
      const distantGroup = document.createElement("optgroup");
      distantGroup.label = "Plus tard";
      for (const week of distantWeeks)
        distantGroup.append(createWeekOption(week, counts.get(week) ?? 0));
      options.push(distantGroup);
    }
    weekSelect.replaceChildren(...options);
    weekSelect.value = selectedWeek;

    const weekEvents = events.filter(
      (event) => startOfWeek(event.date) === selectedWeek,
    );
    if (resultsCount) resultsCount.textContent = String(weekEvents.length);
    if (resultsLabel)
      resultsLabel.textContent =
        weekEvents.length > 1
          ? "randonnées annoncées cette semaine."
          : "randonnée annoncée cette semaine.";
    if (resultsMessage) resultsMessage.hidden = weekEvents.length === 0;

    const departement = departementSelect?.value ?? "all";
    const content =
      weekEvents.length > 0
        ? createPlanning(weekEvents, selectedWeek)
        : createEmptyWeek(selectedWeek, departement);
    const organizerCallout = createOrganizerCallout();
    calendarContent.replaceChildren(
      ...[content, organizerCallout].filter(Boolean),
    );

    const index = displayedWeeks.indexOf(selectedWeek);
    previousWeekButton.disabled = index <= 0;
    nextWeekButton.disabled = index >= displayedWeeks.length - 1;
    if (index > 0)
      previousWeekButton.setAttribute(
        "aria-label",
        `Semaine précédente : ${formatWeek(displayedWeeks[index - 1])}`,
      );
    if (index < displayedWeeks.length - 1)
      nextWeekButton.setAttribute(
        "aria-label",
        `Semaine suivante : ${formatWeek(displayedWeeks[index + 1])}`,
      );
  };

  try {
    const response = await fetch("/calendrier/events.json", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    allEvents = await response.json();
    if (!Array.isArray(allEvents) || allEvents.length === 0)
      throw new Error("empty calendar");
  } catch (error) {
    console.error("[calendar] enhancement unavailable", error);
    return;
  }

  readURL();
  render();
  weekNavigation.hidden = false;
  if (pagination) pagination.hidden = true;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
    updateURL();
    filterDetails?.removeAttribute("open");
  });

  document.getElementById("reset-button")?.addEventListener("click", () => {
    if (departementSelect) departementSelect.value = "all";
    selectedWeek = currentWeek;
    render();
    updateURL();
    filterDetails?.removeAttribute("open");
  });

  weekSelect.addEventListener("change", () => {
    selectedWeek = weekSelect.value;
    render();
    updateURL();
  });

  previousWeekButton.addEventListener("click", () => {
    const index = displayedWeeks.indexOf(selectedWeek);
    if (index <= 0) return;
    selectedWeek = displayedWeeks[index - 1];
    render();
    updateURL();
  });

  nextWeekButton.addEventListener("click", () => {
    const index = displayedWeeks.indexOf(selectedWeek);
    if (index < 0 || index >= displayedWeeks.length - 1) return;
    selectedWeek = displayedWeeks[index + 1];
    render();
    updateURL();
  });

  window.addEventListener("popstate", () => {
    readURL();
    render();
  });
};

initTabs();
initCalendar();

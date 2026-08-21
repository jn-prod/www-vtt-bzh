const PAGE_SIZE = 20;

const filterDetails = document.getElementById("filter-details");
const form = document.getElementById("search-form");
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");
const departementSelect = document.getElementById("departement");
const eventsList = document.getElementById("events-list");
const loadMoreButton = document.getElementById("load-more");
const pagination = document.getElementById("calendar-pagination");
const resultsCount = document.getElementById("results-count");
const resultsLabel = document.getElementById("results-label");

const dateToISO = (date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .split("T")[0];

const addText = (parent, text, className) => {
  const element = document.createElement("span");
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
};

const addIcon = (parent, name) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("icon");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `#icon-${name}`);
  svg.append(use);
  parent.append(svg);
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
  details.className = "event";
  details.dataset.date = event.date;
  details.dataset.departement = String(event.departement);

  const summary = document.createElement("summary");
  summary.className = "event__summary";
  addText(summary, event.name, "event__name u-h3");

  const meta = addText(summary, "", "event__meta");
  const date = addText(meta, "", "event__meta-item");
  addIcon(date, "calendar");
  const time = document.createElement("time");
  time.className = "event__date";
  time.dateTime = event.date;
  time.textContent = event.dateFormatted;
  date.append(time);

  const location = addText(meta, "", "event__meta-item");
  addIcon(location, "pin");
  addText(location, `${event.city} (${event.departement})`, "event__location");
  if (event.canceled) addText(location, "Annulée", "badge badge--danger");
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
    link.className = "btn btn--primary";
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

const initCalendar = () => {
  if (!eventsList || !form) return;

  const today = new Date();
  const oneYearLater = new Date(today);
  oneYearLater.setDate(oneYearLater.getDate() + 365);
  if (startDateInput) startDateInput.value = dateToISO(today);
  if (endDateInput) endDateInput.value = dateToISO(oneYearLater);

  let eventsPromise;
  const loadEvents = () => {
    eventsPromise ??= fetch("/calendrier/events.json", {
      headers: { Accept: "application/json" },
    }).then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const events = await response.json();
      if (!Array.isArray(events) || events.length === 0)
        throw new Error("empty calendar");
      return events;
    });
    return eventsPromise;
  };

  let page = 1;
  const filteredEvents = (events) => {
    const from = startDateInput?.value ?? "";
    const to = endDateInput?.value ?? "";
    const departement = departementSelect?.value ?? "all";
    return events.filter(
      (event) =>
        (!from || event.date >= from) &&
        (!to || event.date <= to) &&
        (departement === "all" || String(event.departement) === departement),
    );
  };

  const render = (events) => {
    const filtered = filteredEvents(events);
    const visible = filtered.slice(0, page * PAGE_SIZE);
    eventsList.replaceChildren(...visible.map(createEvent));
    if (resultsCount) resultsCount.textContent = String(filtered.length);
    if (resultsLabel)
      resultsLabel.textContent =
        filtered.length > 1
          ? "randonnées à découvrir."
          : "randonnée à découvrir.";
    if (loadMoreButton)
      loadMoreButton.hidden = visible.length >= filtered.length;
  };

  const enhance = async (callback) => {
    if (loadMoreButton) loadMoreButton.disabled = true;
    try {
      const events = await loadEvents();
      callback(events);
    } catch (error) {
      console.error("[calendar] enhancement unavailable", error);
      if (loadMoreButton) loadMoreButton.hidden = true;
      if (pagination) pagination.hidden = false;
    } finally {
      if (loadMoreButton) loadMoreButton.disabled = false;
    }
  };

  if (pagination) pagination.hidden = true;
  if (loadMoreButton) loadMoreButton.hidden = false;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    page = 1;
    enhance((events) => {
      render(events);
      filterDetails?.removeAttribute("open");
    });
  });

  document.getElementById("reset-button")?.addEventListener("click", () => {
    if (startDateInput) startDateInput.value = dateToISO(today);
    if (endDateInput) endDateInput.value = dateToISO(oneYearLater);
    if (departementSelect) departementSelect.value = "all";
    page = 1;
    enhance((events) => {
      render(events);
      filterDetails?.removeAttribute("open");
    });
  });

  loadMoreButton?.addEventListener("click", () => {
    enhance((events) => {
      page += 1;
      render(events);
    });
  });
};

initTabs();
initCalendar();

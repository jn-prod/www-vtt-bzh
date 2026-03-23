const PAGE_SIZE = 20;
let page = 1;

// ── DOM refs ─────────────────────────────────────────────────────────────────

const filterDetails = document.getElementById("filter-details");
const form = document.getElementById("search-form");
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");
const dptSelect = document.getElementById("departement");
const eventsList = document.getElementById("events-list");
const loadMoreBtn = document.getElementById("load-more");
const resultsCount = document.getElementById("results-count");

// ── Utilities ─────────────────────────────────────────────────────────────────

const dateToYYYYMMDD = (d) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
    .toISOString()
    .split("T")[0];

// ── Events list ───────────────────────────────────────────────────────────────

const allEvents = eventsList
  ? Array.from(eventsList.querySelectorAll("details"))
  : [];

// ── Filter & pagination ───────────────────────────────────────────────────────

const getFilteredEvents = () => {
  const from = startDateInput?.value ?? "";
  const to = endDateInput?.value ?? "";
  const where = dptSelect?.value ?? "all";

  return allEvents.filter((el) => {
    const date = el.dataset.date ?? "";
    const dept = el.dataset.departement ?? "";
    const dateOk = date >= from && date <= to;
    const deptOk = where === "all" || dept === where;
    return dateOk && deptOk;
  });
};

const applyPagination = () => {
  const filtered = getFilteredEvents();
  allEvents.forEach((el) => {
    el.hidden = true;
  });
  if (resultsCount) resultsCount.textContent = String(filtered.length);
  filtered.forEach((el, i) => {
    el.hidden = i >= page * PAGE_SIZE;
  });
  if (loadMoreBtn) loadMoreBtn.hidden = filtered.length <= page * PAGE_SIZE;
};

const applyFilter = () => {
  page = 1;
  applyPagination();
};

// ── Init date fields ──────────────────────────────────────────────────────────

const now = new Date();
const oneYearLater = new Date(
  now.getFullYear() + 1,
  now.getMonth(),
  now.getDate(),
);

if (startDateInput) startDateInput.value = dateToYYYYMMDD(now);
if (endDateInput) endDateInput.value = dateToYYYYMMDD(oneYearLater);

// Pagination initiale (sans filtre, affiche la première page)
applyPagination();

// ── Event listeners ───────────────────────────────────────────────────────────

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  applyFilter();
  if (filterDetails) filterDetails.removeAttribute("open");
});

document.getElementById("reset-button")?.addEventListener("click", () => {
  if (startDateInput) startDateInput.value = dateToYYYYMMDD(now);
  if (endDateInput) endDateInput.value = dateToYYYYMMDD(oneYearLater);
  if (dptSelect) dptSelect.value = "all";
  applyFilter();
  if (filterDetails) filterDetails.removeAttribute("open");
});

loadMoreBtn?.addEventListener("click", () => {
  page++;
  applyPagination();
});

// ── Wufoo (page ajouter.html uniquement) ─────────────────────────────────────

if (document.getElementById("wufoo-q1llzwkr1sa7rtj")) {
  import("/assets/js/wufoo.js");
}

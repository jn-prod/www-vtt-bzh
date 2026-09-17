import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = ['/', '/calendrier/ajouter.html'];
const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
];

test.beforeEach(async ({ page }) => {
  await page.route('https://static.cloudflareinsights.com/**', (route) => route.abort());
});

const fillRequiredEventForm = async (page) => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  await page.getByLabel('Nom de la randonnée *').fill('Rando de test');
  await page.getByLabel('Date *').fill(date.toISOString().slice(0, 10));
  await page.getByLabel('Heure de départ *').fill('8h30');
  await page.getByLabel('Ville *').fill('Pontivy');
  await page.getByLabel('Département *').selectOption('56');
  await page.getByLabel('Lieu de rendez-vous *').fill('Place du marché');
  await page.getByLabel('Organisateur *').fill('Club de test');
  await page.getByLabel('Email de contact *').fill('club@example.org');
  await page.locator('#event-form-consent').check();
};

for (const pathname of pages) {
  test(`${pathname} respecte les invariants d'accessibilité`, async ({ page }) => {
    await page.goto(pathname);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(({ impact }) => ['serious', 'critical'].includes(impact));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}

for (const viewport of viewports) {
  test(`aucun débordement à ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const pathname of pages) {
      await page.goto(pathname);
      const widths = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }));
      expect(widths.document, pathname).toBeLessThanOrEqual(widths.viewport + 1);
    }
  });
}

test('le calendrier charge les événements suivants sans gonfler le HTML initial', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#events-list .event')).toHaveCount(20);
  await expect(page.locator('#events-list .newsletter-prompt--sticky')).toHaveCount(1);
  const total = Number(await page.locator('#results-count').textContent());
  expect(total).toBeGreaterThan(20);
  await page.locator('#load-more').click();
  await expect(page.locator('#events-list .event')).toHaveCount(Math.min(40, total));
});

test('les filtres couvrent aussi les événements au-delà du HTML initial', async ({ page }) => {
  const departement = '35';
  const date = new Date();
  date.setDate(date.getDate() + 30);
  const events = Array.from({ length: 21 }, (_, index) => ({
    id: `event-35-${index + 1}`,
    date: date.toISOString().slice(0, 10),
    dateFormatted: '20 sept. 2026',
    name: `Rando Ille-et-Vilaine ${index + 1}`,
    city: 'Rennes',
    departement: Number(departement),
    canceled: false,
  }));
  await page.route('**/calendrier/events.json', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(events),
    })
  );
  await page.goto('/');
  await page.locator('#filter-details > summary').click();
  await page.locator('#departement').selectOption(departement);
  await page.getByRole('button', { name: 'Rechercher' }).click();
  await expect(page.locator('#results-count')).toHaveText(String(events.length));
  await expect(page.locator('#events-list .event')).toHaveCount(20);
  await expect(page.locator('#events-list .newsletter-prompt--sticky')).toHaveCount(1);
  await page.locator('#load-more').click();
  await expect(page.locator('#events-list .event')).toHaveCount(events.length);
});

test('le header reste simple et le rappel sticky conduit à l’agenda', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const header = page.locator('.site-header');
  await expect(header.getByRole('link')).toHaveCount(1);
  await expect(header.getByRole('link', { name: 'vtt.bzh' })).toBeVisible();
  await expect(header).toHaveCSS('position', 'static');
  await expect(page.locator('.site-nav')).toHaveCSS('justify-content', 'center');

  const prompt = page.locator('.newsletter-prompt--sticky');
  await expect(prompt).toHaveCSS('position', 'sticky');
  await prompt.getByRole('link', { name: 'Recevoir l’agenda' }).click();
  await expect(page).toHaveURL(/#newsletter$/u);
});

test('une recherche sans résultat conserve une issue vers l’agenda', async ({ page }) => {
  const events = [
    {
      id: 'event-35',
      date: '2026-10-20',
      dateFormatted: '20 oct. 2026',
      name: 'Rando Ille-et-Vilaine',
      city: 'Rennes',
      departement: 35,
      canceled: false,
    },
  ];
  await page.route('**/calendrier/events.json', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(events) })
  );
  await page.goto('/');
  await page.locator('#filter-details > summary').click();
  await page.locator('#departement').selectOption('22');
  await page.getByRole('button', { name: 'Rechercher' }).click();
  await expect(page.locator('#msg-no-results-dynamic')).toBeVisible();
  await expect(page.locator('#msg-no-results-dynamic')).toContainText('recevez l’agenda');
});

test('un seul rappel sticky suit la cinquième rando', async ({ page }) => {
  await page.goto('/');
  const prompt = page.locator('#events-list > li:nth-child(6).newsletter-prompt--sticky');
  await expect(page.locator('.newsletter-prompt')).toHaveCount(1);
  await expect(prompt).toContainText('Les randos à retenir, chaque mois.');
  await expect(prompt.getByRole('link', { name: 'Recevoir l’agenda' })).toHaveAttribute('href', '#newsletter');
});

test('le rendu JavaScript neutralise les données événement hostiles', async ({ page }) => {
  const safeEvent = (index) => ({
    id: `event-safe-${index}`,
    date: '2026-09-20',
    dateFormatted: '20 sept. 2026',
    name: `Rando ${index}`,
    city: 'Pontivy',
    departement: 56,
    canceled: false,
  });
  const hostile = {
    ...safeEvent(21),
    id: 'event-hostile\" autofocus onfocus=\"alert(1)',
    name: '<img src=x onerror=alert(1)>',
    city: '<script>alert(1)</script>',
    description: '<script>alert(2)</script>',
    organisateur: '<img src=x onerror=alert(3)>',
    email: 'contact@example.org\" onfocus=\"alert(4)',
    website: 'https://example.org/?q=\" onmouseover=\"alert(5)',
  };
  await page.route('**/calendrier/events.json', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([...Array.from({ length: 20 }, (_, index) => safeEvent(index + 1)), hostile]),
    })
  );
  await page.goto('/');
  await page.locator('#load-more').click();
  await expect(page.locator('#events-list .event')).toHaveCount(21);
  await expect(page.getByText('<img src=x onerror=alert(1)>', { exact: true })).toBeVisible();
  await expect(page.locator('#events-list script')).toHaveCount(0);
  await expect(page.locator('#events-list [onerror], #events-list [onfocus], #events-list [onmouseover]')).toHaveCount(
    0
  );
});

test('la pagination reste utilisable sans JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#events-list .event')).toHaveCount(20);
  await page.getByRole('link', { name: 'Page suivante' }).click();
  await expect(page).toHaveURL(/\/calendrier\/page\/2\/$/u);
  await expect(page.locator('.events-list .event')).toHaveCount(20);
  await context.close();
});

test('le formulaire reste soumissible sans JavaScript et sans donnée dans l’URL', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  let request;
  await context.route('**/functions/v1/submit-event', async (route) => {
    request = route.request();
    await route.fulfill({
      status: 303,
      headers: { Location: `${baseURL}/calendrier/soumission-confirmee.html` },
    });
  });
  const page = await context.newPage();
  await page.goto('/calendrier/ajouter.html');
  await fillRequiredEventForm(page);
  await page.getByRole('button', { name: 'Publier ma rando' }).click();
  await expect(page).toHaveURL(`${baseURL}/calendrier/soumission-confirmee.html`);
  expect(request.method()).toBe('POST');
  expect(request.url()).not.toContain('club%40example.org');
  expect(request.postData()).toContain('email=club%40example.org');
  await context.close();
});

test('un échec de soumission conserve les informations saisies', async ({ page }) => {
  await page.route('**/functions/v1/submit-event', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'unavailable' }) })
  );
  await page.goto('/calendrier/ajouter.html');
  await fillRequiredEventForm(page);
  await page.getByRole('button', { name: 'Publier ma rando' }).click();
  await expect(page.locator('#event-form-feedback')).toContainText('Vos informations sont conservées');
  await expect(page.getByLabel('Nom de la randonnée *')).toHaveValue('Rando de test');
});

test('une soumission réussie remet le formulaire à zéro et propose le partage', async ({ page }) => {
  let payload;
  await page.route('**/functions/v1/submit-event', async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true,"id":"test"}' });
  });
  await page.goto('/calendrier/ajouter.html');
  await fillRequiredEventForm(page);
  await page.getByRole('button', { name: 'Publier ma rando' }).click();
  await expect(page.locator('#event-form-feedback')).toContainText('prochain rafraîchissement quotidien');
  await expect(page.getByLabel('Nom de la randonnée *')).toHaveValue('');
  await expect(page.locator('#event-form-share')).toBeVisible();
  await expect(page.getByLabel('Lien à partager')).toHaveValue('https://www.vtt.bzh/calendrier/ajouter.html');
  expect(payload).not.toHaveProperty('active');
  expect(payload).not.toHaveProperty('origin');
  expect(payload).not.toHaveProperty('lock');
  expect(payload).not.toHaveProperty('canceled');
});

test('une inscription newsletter demandée par un organisateur est envoyée à Kit', async ({ page }) => {
  let kitRequest;
  await page.route('**/functions/v1/submit-event', (route) =>
    route.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true,"id":"test"}' })
  );
  await page.route('**/forms/9677378/subscriptions', async (route) => {
    kitRequest = route.request();
    await route.fulfill({ status: 202, body: '' });
  });
  await page.goto('/calendrier/ajouter.html');
  await fillRequiredEventForm(page);
  await page.locator('#event-form-newsletter').check();
  await page.getByRole('button', { name: 'Publier ma rando' }).click();
  await expect(page.locator('#event-form-feedback')).toContainText('demande d’inscription à Rando Bretagne');
  expect(kitRequest?.method()).toBe('POST');
  expect(kitRequest?.postData()).toContain('email_address=club%40example.org');
});

test('le partage sélectionne le lien si Clipboard API est refusée', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('denied')) },
    });
  });
  await page.route('**/functions/v1/submit-event', (route) =>
    route.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true,"id":"test"}' })
  );
  await page.goto('/calendrier/ajouter.html');
  await fillRequiredEventForm(page);
  await page.getByRole('button', { name: 'Publier ma rando' }).click();
  const input = page.getByLabel('Lien à partager');
  await page.getByRole('button', { name: 'Copier le lien' }).click();
  await expect(input).toBeFocused();
  const selection = await input.evaluate((element) => ({
    start: element.selectionStart,
    end: element.selectionEnd,
    length: element.value.length,
  }));
  expect(selection).toEqual({ start: 0, end: selection.length, length: selection.length });
});

test('Kit ne reçoit aucune requête avant une inscription explicite', async ({ page }) => {
  const kitRequests = [];
  page.on('request', (request) => {
    if (/kit\.com|convertkit\.com/u.test(request.url())) kitRequests.push(request.url());
  });
  await page.goto('/');
  await page.waitForTimeout(300);
  expect(kitRequests).toEqual([]);
  await expect(page.locator('form[action*="app.kit.com"]')).toHaveCount(1);
});

test('les anciennes entrées newsletter renvoient vers la destination canonique', async ({ request }) => {
  const checks = [
    ['/newsletter.html', 'https://www.nicolasjouanno.com/newsletter/?utm_source=vtt-bzh'],
    ['/newsletter/', 'https://www.nicolasjouanno.com/newsletter/?utm_source=vtt-bzh'],
    ['/merci.html', 'https://www.nicolasjouanno.com/newsletter/merci/?utm_source=vtt-bzh'],
    ['/newsletter/2026-07/', 'https://www.nicolasjouanno.com/newsletter/2026-07/'],
    ['/newsletter/2026-08/', 'https://www.nicolasjouanno.com/newsletter/2026-08/'],
  ];

  for (const [path, canonical] of checks) {
    const response = await request.get(path);
    const html = await response.text();
    expect(response.ok(), path).toBeTruthy();
    expect(html, path).toContain(`<link rel="canonical" href="${canonical}`);
    expect(html, path).toContain(`content="0; url=${canonical}`);
  }
});

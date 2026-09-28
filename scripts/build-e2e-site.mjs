import { execFile } from 'node:child_process';
import { access, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const EVENTS_FILE = join(ROOT, 'www', '_data', 'events.json');
const DESTINATION = join(ROOT, 'www', '_site-e2e');
const PAGE_SIZE = 20;
const firstEventDate = new Date();
firstEventDate.setUTCHours(12, 0, 0, 0);

const mockEvents = Array.from({ length: PAGE_SIZE * 2 + 1 }, (_, index) => {
  const date = new Date(firstEventDate);
  date.setUTCDate(date.getUTCDate() + index + 1);
  const day = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);

  return {
    id: `e2e-event-${index + 1}`,
    date: date.toISOString().slice(0, 10),
    dateFormatted: day,
    name: `Rando de test ${index + 1}`,
    city: 'Pontivy',
    departement: 56,
    hour: '09h00',
    place: 'Place du marché',
    organisateur: 'Club de test',
    price: '5 €',
    canceled: false,
  };
});

const readExistingEvents = async () => {
  try {
    await access(EVENTS_FILE);
    return readFile(EVENTS_FILE);
  } catch {
    return null;
  }
};

const originalEvents = await readExistingEvents();

try {
  await rm(DESTINATION, { recursive: true, force: true });
  await writeFile(EVENTS_FILE, `${JSON.stringify(mockEvents, null, 2)}\n`);
  await execute('bundle', ['exec', 'jekyll', 'build', '--destination', '_site-e2e'], {
    cwd: join(ROOT, 'www'),
  });
} finally {
  if (originalEvents) {
    await writeFile(EVENTS_FILE, originalEvents);
  } else {
    await rm(EVENTS_FILE, { force: true });
  }
}

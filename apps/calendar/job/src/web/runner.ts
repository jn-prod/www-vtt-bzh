import axios from 'axios';
import { parseHTML } from 'linkedom';
import { decode } from 'text-converter';
import { DatePattern, getDateFromPattern } from 'dates';
import { updateOrCreate, type SupabaseClient } from 'repository';
import { CalendarEvent, Kind, CreateEventDto } from 'calendar-shared';
import assert from 'assert';

import { Config } from '../config';
import { CronStartUri, ElementSelector, body, selector, url } from './types';

const getUrl = (cronStartUri: CronStartUri, year: number): url =>
  `${cronStartUri}/sorties/vtt/${year || new Date().getFullYear()}-avenir-56-29-22-35-44-0-0-0-1.html`;

const parseUrls = (cronStartUri: CronStartUri, body: body): url[] => {
  assert.ok(body, '[parseUrls] - missing body param');
  try {
    const { document } = parseHTML(body);

    return Array.from(document.querySelectorAll('a'))
      .filter((e) => (e as unknown as HTMLAnchorElement).textContent === 'VOIR')
      .map((e) => ((e as unknown as HTMLAnchorElement).getAttribute('href') || '').replace('../../', '/'));
  } catch (err) {
    return [];
  }
};

const getUrls = async (cronStartUri: CronStartUri): Promise<url[]> => {
  const currentYear = Number(new Date().getFullYear());
  const startUrl = getUrl(cronStartUri, currentYear);

  try {
    const { data } = await axios.get(startUrl);
    return parseUrls(cronStartUri, data);
  } catch (e) {
    console.error(`[getUrls] - error in process ${getUrls}`);
    return [];
  }
};

const extractWithCss = (document: Document, selector: selector): string => {
  assert.ok(document, '[extractWithCss] - missing $ param');
  assert.ok(selector, '[extractWithCss] - missing selector param');

  const text = (document.querySelector(selector)?.textContent || '').trim();
  return text.split('').join('€');
};

const canceled = (document: Document, selector: selector): boolean => {
  assert.ok(document, '[canceled] - missing document param');
  assert.ok(selector, '[canceled] - missing selector param');

  if (document.querySelector(selector) === null) return false;

  return (document.querySelector('head')?.innerHTML || '').includes('crise_sanitaire_v1');
};

const parseEvent = (body: body, url: url): Partial<CreateEventDto> | null => {
  assert.ok(body, '[parseEvent] - missing body param');
  try {
    const { document } = parseHTML(body);

    return {
      name: extractWithCss(document, ElementSelector.NOM),
      city: extractWithCss(document, ElementSelector.LIEU),
      departement: Number(extractWithCss(document, ElementSelector.DPT)),
      date: getDateFromPattern(extractWithCss(document, ElementSelector.DATE), DatePattern.DDMMYYYY),
      organisateur: extractWithCss(document, ElementSelector.ORGANISATEUR),
      hour: extractWithCss(document, ElementSelector.HORAIRES),
      website: extractWithCss(document, ElementSelector.LIEN),
      place: extractWithCss(document, ElementSelector.RDV),
      price: extractWithCss(document, ElementSelector.PRIX),
      contact: extractWithCss(document, ElementSelector.CONTACT),
      description: extractWithCss(document, ElementSelector.DESCRIPTION),
      canceled: canceled(document, ElementSelector.ANNULE),
      origin: url,
      kind: Kind.VTT,
      lock: false,
    };
  } catch (e) {
    console.error(e);
    return null;
  }
};

export async function webRunner(db: SupabaseClient, config: Config): Promise<void> {
  const start = new Date().getTime();
  console.log('start cron ...');
  return getUrls(config.cronStartUri)
    .then(async (urls) => {
      for (const url of urls) {
        try {
          const { status, data } = await axios.get(`${config.cronStartUri}${url}`, {
            responseType: 'arraybuffer',
          });

          if (status !== 200) {
            console.error(`[getEvents] fail to process${url}: ${status}, ${data}`);
            continue;
          }

          // parse content
          const event = parseEvent(decode(data, 'latin1'), url) as CreateEventDto;

          // if content we insert it in db
          if (event === null) continue;

          const updated = await updateOrCreate<CreateEventDto, CalendarEvent>(
            db,
            config.supabase.table,
            [{ column: 'origin', operator: 'eq', value: event.origin }],
            event
          );
          if (config.locale && updated.ok) console.log(updated.value?.origin);
        } catch (err) {
          console.log(err);
        }
      }
    })
    .catch((err) => {
      console.error('[job] - webRunner', err);
    })
    .finally(() => {
      console.log(`... end cron (${Math.floor((new Date().getTime() - start) / 1000)}s)`);
    });
}

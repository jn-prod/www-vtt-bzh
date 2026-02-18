import { Filter, find, updateOrCreate, type SupabaseClient } from 'repository';
import { CalendarEvent, Kind, CreateEventDto, UpdateEventDto } from 'calendar-shared';
import { Config } from '../config';
import { ElementSelector } from './types';
import { client, createWindow } from 'http-client';
import type { Maybe } from 'types';

const getTextContent = (element: Maybe<Element>): string | undefined => {
  if (typeof element?.textContent === 'string') {
    return element.textContent.trim();
  }
};

const endCron = (start: number): void => {
  console.log(`... end cron (${Math.floor((new Date().getTime() - start) / 1000)}s)`);
};

export async function webRunner(db: SupabaseClient, config: Config): Promise<void> {
  const today = new Date();
  const start = today.getTime();
  console.log('start cron ...');

  const cronClient = client(config.cronStartUri);

  const query: Filter[] = [
    { column: 'active', operator: 'eq', value: true },
    { column: 'date', operator: 'gte', value: today.toISOString().split('T')[0] },
  ];
  const dbEventsResponse = await find<CalendarEvent>(db, config.supabase.table, query, 'origin');

  const dbEventsToDisable = new Set<string>();
  if (dbEventsResponse.ok && Array.isArray(dbEventsResponse.value)) {
    dbEventsResponse.value.forEach((event) => {
      if (event.origin?.startsWith('/sortie/')) {
        dbEventsToDisable.add(event.origin);
      }
    });
  }

  // get urls to parse page
  const main = await cronClient<string>(`/sorties/vtt/${today.getFullYear()}-avenir-56-29-22-35-44-0-0-0-1.html`, {
    responseType: 'text',
  });

  // test reponse validity
  if (!main.ok) {
    endCron(start);
    return;
  }

  // get urls
  const urls: string[] = Array.from(
    createWindow(main.value)?.document?.querySelectorAll('td > a[href*="sortie"]') ?? []
  ).map((url) => (url.getAttribute('href') ?? '').replace('../../', '/'));

  // get event content and update db
  for (const url of urls) {
    try {
      const page = await cronClient<ArrayBuffer>(url, {
        responseType: 'arrayBuffer',
      });

      // test reponse validity
      if (!page.ok) {
        continue;
      }

      const document = createWindow(page.value, { decode: 'iso-8859-1' })?.document;
      if (!document) {
        continue;
      }

      const event: CreateEventDto = {
        name: getTextContent(document.querySelector(ElementSelector.NOM)) ?? '',
        city: getTextContent(document.querySelector(ElementSelector.LIEU)),
        departement: Number(getTextContent(document.querySelector(ElementSelector.DPT))),
        date: new Date((getTextContent(document.querySelector(ElementSelector.DATE)) ?? '').split("/").reverse().join("-")),
        organisateur: getTextContent(document.querySelector(ElementSelector.ORGANISATEUR)),
        hour: getTextContent(document.querySelector(ElementSelector.HORAIRES)) ?? '',
        website: getTextContent(document.querySelector(ElementSelector.LIEN)),
        place: getTextContent(document.querySelector(ElementSelector.RDV)),
        price: getTextContent(document.querySelector(ElementSelector.PRIX)),
        contact: getTextContent(document.querySelector(ElementSelector.CONTACT)),
        description: getTextContent(document.querySelector(ElementSelector.DESCRIPTION)),
        canceled: Boolean(document.querySelector(ElementSelector.ANNULE)),
        origin: url,
        kind: Kind.VTT,
        lock: false,
        active: true,
      };

      const updated = await updateOrCreate<CreateEventDto, CalendarEvent>(
        db,
        config.supabase.table,
        [{ column: 'origin', operator: 'eq', value: event.origin }],
        event
      );

      if (updated.ok && typeof updated.value?.origin === 'string') {
        dbEventsToDisable.delete(updated.value.origin);

        if (config.locale) {
          console.log('update succeeded :', url);
        }
      } else {
        if (config.locale) {
          console.error('update failed :', url);
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  for (const origin of dbEventsToDisable) {
    if (urls.find((url) => url === origin) !== undefined) {
      console.log('disabled skiped :', origin);

      continue;
    }
    const event: UpdateEventDto = {
      origin,
      active: false,
    };
    const disabled = await updateOrCreate<UpdateEventDto, CalendarEvent>(
      db,
      config.supabase.table,
      [{ column: 'origin', operator: 'eq', value: event.origin }],
      event
    );

    if (disabled.ok && typeof disabled.value?.origin === 'string') {
      dbEventsToDisable.delete(disabled.value.origin);
      if (config.locale) {
        console.log('disabled succeeded :', disabled);
      }
    }
  }
  endCron(start);
}

import { DatePattern, getDateFromPattern } from 'dates';
import { updateOrCreate, type SupabaseClient } from 'repository';
import { CalendarEvent, Kind, CreateEventDto } from 'calendar-shared';

import { Config } from '../config';
import { ElementSelector, url } from './types';
import { client, createWindow } from 'http-client';
import type { Maybe } from 'types';

const getTextContent = (element: Maybe<Element>): string | undefined =>
  element?.textContent ? element.textContent.trim() : undefined;

const endCron = (start: number): void => {
  console.log(`... end cron (${Math.floor((new Date().getTime() - start) / 1000)}s)`);
};

export async function webRunner(db: SupabaseClient, config: Config): Promise<void> {
  const start = new Date().getTime();
  console.log('start cron ...');

  const cronClient = client(config.cronStartUri);

  // get urls to parse page
  const main = await cronClient<string>(`/sorties/vtt/${new Date().getFullYear()}-avenir-56-29-22-35-44-0-0-0-1.html`, {
    responseType: 'text',
  });

  // test reponse validity
  if (!main.ok) {
    endCron(start);
    return;
  }

  // get urls
  const urls: Element[] = Array.from(
    createWindow(main.value)?.document?.querySelectorAll('td > a[href*="sortie"]') ?? []
  );

  // get event content and update db
  for (const url of urls) {
    try {
      const origin = (url.getAttribute('href') ?? '').replace('../../', '/');
      const page = await cronClient<ArrayBuffer>(origin, {
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
        name: getTextContent(document.querySelector(ElementSelector.NOM)) || '',
        city: getTextContent(document.querySelector(ElementSelector.LIEU)),
        departement: Number(getTextContent(document.querySelector(ElementSelector.DPT))),
        date: getDateFromPattern(
          getTextContent(document.querySelector(ElementSelector.DATE)) || '',
          DatePattern.DDMMYYYY
        ),
        organisateur: getTextContent(document.querySelector(ElementSelector.ORGANISATEUR)),
        hour: getTextContent(document.querySelector(ElementSelector.HORAIRES)) || '',
        website: getTextContent(document.querySelector(ElementSelector.LIEN)),
        place: getTextContent(document.querySelector(ElementSelector.RDV)),
        price: getTextContent(document.querySelector(ElementSelector.PRIX)),
        contact: getTextContent(document.querySelector(ElementSelector.CONTACT)),
        description: getTextContent(document.querySelector(ElementSelector.DESCRIPTION)),
        canceled: Boolean(document.querySelector(ElementSelector.ANNULE)),
        origin,
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

      if (config.locale && updated.ok) {
        console.log(updated.value?.origin);
      }
    } catch (err) {
      console.log(err);
    }
  }
  endCron(start);
}

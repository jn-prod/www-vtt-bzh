import { DatePattern, getDateFromPattern } from 'dates';
import { updateOrCreate, type SupabaseClient } from 'repository';
import { CalendarEvent, Kind, CreateEventDto } from 'calendar-shared';

import { Config } from '../config';
import { ElementSelector, url } from './types';
import { Scrapper } from 'http-client';

const parseUrls = (elements: Element[] | null): url[] | undefined =>
  elements
    ?.filter((e) => (e as unknown as HTMLAnchorElement).textContent === 'VOIR')
    .map((e) => ((e as unknown as HTMLAnchorElement).getAttribute('href') || '').replace('../../', '/'));

const getTextContent = (element: Element | null): string => (element?.textContent || '').trim().split('').join('€');

export async function webRunner(db: SupabaseClient, config: Config): Promise<void> {
  const start = new Date().getTime();
  console.log('start cron ...');

  const startPageUrl = `/sorties/vtt/${new Date().getFullYear()}-avenir-56-29-22-35-44-0-0-0-1.html`;
  const scrapper = new Scrapper(config.cronStartUri);
  const urls = parseUrls((await scrapper.request(startPageUrl, { responseType: 'text' }))?.querySelectorAll('a'));
  if (!urls) {
    console.log(`... end cron (${Math.floor((new Date().getTime() - start) / 1000)}s)`);
    return;
  }
  for (const url of urls) {
    try {
      (
        await scrapper.request(url, {
          responseType: 'arrayBuffer',
        })
      ).decode('iso-8859-1');

      const event: CreateEventDto = {
        name: getTextContent(scrapper.querySelector(ElementSelector.NOM)),
        city: getTextContent(scrapper.querySelector(ElementSelector.LIEU)),
        departement: Number(getTextContent(scrapper.querySelector(ElementSelector.DPT))),
        date: getDateFromPattern(
          getTextContent(scrapper.querySelector(ElementSelector.DATE)) || '',
          DatePattern.DDMMYYYY
        ),
        organisateur: getTextContent(scrapper.querySelector(ElementSelector.ORGANISATEUR)),
        hour: getTextContent(scrapper.querySelector(ElementSelector.HORAIRES)),
        website: getTextContent(scrapper.querySelector(ElementSelector.LIEN)),
        place: getTextContent(scrapper.querySelector(ElementSelector.RDV)),
        price: getTextContent(scrapper.querySelector(ElementSelector.PRIX)),
        contact: getTextContent(scrapper.querySelector(ElementSelector.CONTACT)),
        description: getTextContent(scrapper.querySelector(ElementSelector.DESCRIPTION)),
        canceled: Boolean(scrapper.querySelector(ElementSelector.ANNULE)),
        origin: url,
        kind: Kind.VTT,
        lock: false,
        active: true,
      };

      // if no content we insert it in db
      if (event === null) continue;

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
  console.log(`... end cron (${Math.floor((new Date().getTime() - start) / 1000)}s)`);
}

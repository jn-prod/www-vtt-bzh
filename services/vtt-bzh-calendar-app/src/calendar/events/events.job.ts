import axios from 'axios';
import { JSDOM } from 'jsdom';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const assert = require('assert').strict;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Promise = require('bluebird');

import { EventsService } from './events.service';
import config from '../../config/default';
import { CreateEventDto } from './dto/index';
import { DatePattern, getDateFromPattern } from '../../common/utils/date';
import { Kind } from './enums/kind.enum';

type url = string;
type body = string;
type selector = string;

const txt_ref_int_nom_2 = '#txt_ref_int_nom_2';
const txt_ref_int_lieu_2 = '#txt_ref_int_lieu_2';
const txt_ref_int_dpt_2 = '#txt_ref_int_dpt_2';
const txt_ref_int_date_2 = '#txt_ref_int_date_2';
const txt_ref_int_organisateur_2 = '#txt_ref_int_organisateur_2';
const txt_ref_int_horaires_2 = '#txt_ref_int_horaires_2';
const StyleLien1 = '#StyleLien1';
const txt_ref_int_prix2 = '#txt_ref_int_prix2';
const txt_ref_int_contacttxt = '#txt_ref_int_contacttxt';
const txt_ref_int_decription = '#txt_ref_int_decription';
const zone_texte_annule = '#zone_texte_annule';
const txt_ref_int_ldrdv_2 = '#txt_ref_int_ldrdv_2';

const getUrl = (year: number): url => {
  const yearToProcess = year || new Date().getFullYear();
  return `${
    config().vttBzh.cronStartUri
  }/sorties/vtt/${yearToProcess}-avenir-56-29-22-35-44-0-0-0-1.html`;
};

const parseUrls = (body: body): url[] => {
  assert.ok(body, '[parseUrls] - missing body param');
  const { document } = new JSDOM(body, { url: config().vttBzh.cronStartUri })
    .window;

  return Array.from(document.querySelectorAll('a'))
    .filter((e) => (e as HTMLElement).textContent === 'VOIR')
    .map((e) => (e as HTMLElement).getAttribute('href').replace('../../', '/'));
};

const getUrls = async (): Promise<string[]> => {
  const currentYear = Number(new Date().getFullYear());
  const startUrl = getUrl(currentYear);

  let res = [];
  try {
    const response = await axios.get(startUrl);
    res = parseUrls(response.data);
  } catch (e) {
    console.error(`[getUrls] - error in process ${getUrls}`);
  }
  return res;
};

const extractWithCss = (document: HTMLElement, selector: selector): string => {
  assert.ok(document, '[extractWithCss] - missing $ param');
  assert.ok(selector, '[extractWithCss] - missing selector param');

  const text = (document.querySelector(selector)?.textContent || '').trim();
  return text.split('').join('€');
};

const canceled = (document: HTMLElement, selector: selector): boolean => {
  assert.ok(document, '[canceled] - missing $ param');
  assert.ok(selector, '[canceled] - missing selector param');

  const notCanceled = document.querySelector(selector) === null;

  if (notCanceled) return false;

  const maybeCanceled =
    (document.querySelector('head')?.innerHTML || '').indexOf(
      'crise_sanitaire_v1',
    ) > -1;

  return !maybeCanceled;
};

const parseEvent = (body: body, url: url): CreateEventDto => {
  assert.ok(body, '[parseEvent] - missing body param');
  try {
    const root = new JSDOM(body, { url: config().vttBzh.cronStartUri });

    const { document } = root?.window;

    return {
      name: extractWithCss(document, txt_ref_int_nom_2),
      city: extractWithCss(document, txt_ref_int_lieu_2),
      departement: extractWithCss(document, txt_ref_int_dpt_2),
      date: getDateFromPattern(
        extractWithCss(document, txt_ref_int_date_2),
        DatePattern.DDMMYYYY,
      ),
      organisateur: extractWithCss(document, txt_ref_int_organisateur_2),
      hour: extractWithCss(document, txt_ref_int_horaires_2),
      website: extractWithCss(document, StyleLien1),
      place: extractWithCss(document, txt_ref_int_ldrdv_2),
      price: extractWithCss(document, txt_ref_int_prix2),
      contact: extractWithCss(document, txt_ref_int_contacttxt),
      description: extractWithCss(document, txt_ref_int_decription),
      canceled: canceled(document, zone_texte_annule),
      origin: url,
      kind: Kind.VTT,
      updatedAt: new Date(),
    };
  } catch (e) {
    console.error(e);
  }
};

const getEvents = async (
  eventService: EventsService,
  urls: url[],
): Promise<CreateEventDto[]> => {
  assert.ok(urls, '[getEvents] - Missing urls param');
  return Promise.map(
    urls,
    async (url) => {
      console.log(`process ${url} ...`);
      try {
        const { status, data } = await axios.get(
          `${config().vttBzh.cronStartUri}${url}`,
          {
            responseType: 'arraybuffer',
          },
        );
        if (status !== 200) {
          console.error(
            `[getEvents] fail to process${url}: ${status}, ${data}`,
          );
          return;
        }
        const event = parseEvent(data, url);

        await eventService.updateOrCreate({ origin: event.origin }, event);

        console.log(`... done ${url}`);
        // eslint-disable-next-line consistent-return
        return event;
      } catch (e) {
        console.error(`[getEvents] - error occure whith axios.get: ${e}`);
      }
    },
    { concurrency: 3 },
  ).catch((e) => console.error(`[getEvents] - error occure : ${e}`));
};

export async function runner(
  eventService: EventsService,
): Promise<CreateEventDto[]> {
  const start = new Date().getTime();
  console.log('start cron ...');
  try {
    const urls = await getUrls();

    console.log(`we have get ${urls.length} events urls from website`);

    const events = await getEvents(eventService, urls);

    console.log(`we have process ${events.length} events`);

    return events;
  } catch (e) {
    console.error(`[run] - ${e}`);
    throw e;
  } finally {
    console.log(
      `... end cron (${Math.floor((new Date().getTime() - start) / 1000)}s)`,
    );
  }
}

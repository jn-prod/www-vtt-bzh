import axios from "axios";
import { parseHTML, HTMLElement, HTMLAnchorElement } from 'linkedom';
import { decode } from 'text-converter';
const assert = require("assert").strict;

import { put } from "./events.service";
import { CreateEventDto } from "./events.dto";
import { DatePattern, getDateFromPattern } from "utils";
import { Config } from "./events.conf";
import { CalendarEvent, Kind } from "./events.types";
import { DatabaseConnection } from "common";

export type CronStartUri = string;
type url = string;
type body = string;
type selector = string;

enum ElementSelector {
  NOM = "#txt_ref_int_nom_2",
  LIEU = "#txt_ref_int_lieu_2",
  DPT = "#txt_ref_int_dpt_2",
  DATE = "#txt_ref_int_date_2",
  ORGANISATEUR = "#txt_ref_int_organisateur_2",
  HORAIRES = "#txt_ref_int_horaires_2",
  LIEN = "#StyleLien1",
  RDV = "#txt_ref_int_ldrdv_2",
  PRIX = "#txt_ref_int_prix2",
  CONTACT = "#txt_ref_int_contacttxt",
  DESCRIPTION = "#txt_ref_int_decription",
  ANNULE = "#zone_texte_annule",
}

const getUrl = (cronStartUri: CronStartUri, year: number): url =>
  `${cronStartUri}/sorties/vtt/${
    year || new Date().getFullYear()
  }-avenir-56-29-22-35-44-0-0-0-1.html`;

const parseUrls = (cronStartUri: CronStartUri, body: body): url[] => {
  assert.ok(body, "[parseUrls] - missing body param");
  try {
    const { document } = parseHTML(body);

    return Array.from(document.querySelectorAll("a"))
      .filter((e) => (e as HTMLAnchorElement).textContent === "VOIR")
      .map((e) => ((e as HTMLAnchorElement).getAttribute("href") || "").replace("../../", "/"));
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

const extractWithCss = (document: HTMLElement, selector: selector): string => {
  assert.ok(document, "[extractWithCss] - missing $ param");
  assert.ok(selector, "[extractWithCss] - missing selector param");

  const text = (document.querySelector(selector)?.textContent || "").trim();
  return text.split("").join("€");
};

const canceled = (document: HTMLElement, selector: selector): boolean => {
  assert.ok(document, "[canceled] - missing document param");
  assert.ok(selector, "[canceled] - missing selector param");

  if (document.querySelector(selector) === null) return false;

  return (document.querySelector("head")?.innerHTML || "").includes(
    "crise_sanitaire_v1"
  );
};

const parseEvent = (
  cronStartUri: CronStartUri,
  body: body,
  url: url
): CreateEventDto | null => {
  assert.ok(body, "[parseEvent] - missing body param");
  try {
    const { document } = parseHTML(body);

    return {
      name: extractWithCss(document, ElementSelector.NOM),
      city: extractWithCss(document, ElementSelector.LIEU),
      departement: extractWithCss(document, ElementSelector.DPT),
      date: getDateFromPattern(
        extractWithCss(document, ElementSelector.DATE),
        DatePattern.DDMMYYYY
      ),
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
      updatedAt: new Date(),
    } as CreateEventDto;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export async function runner(
  db: DatabaseConnection,
  config: Config
): Promise<(CreateEventDto | null)[]> {
  const start = new Date().getTime();
  console.log("start cron ...");
  const events: (null | CreateEventDto)[] = [];
  try {
    const urls = await getUrls(config.cronStartUri);
    for(const url of urls) {
      try {
        const { status, data } = await axios.get(
          `${config.cronStartUri}${url}`, {
            responseType: 'arraybuffer',
          }
        );
  
        if (status !== 200) {
          console.error(
            `[getEvents] fail to process${url}: ${status}, ${data}`
          );
          continue;
        }

        // convert content to utf-8
        const content = decode(data, 'latin1');

        // parse content
        const event = parseEvent(config.cronStartUri, content, url);
  
        // if content we insert it in db
        if (event !== null) {
          await put<CalendarEvent, CreateEventDto>(
            db,
            config.serviceName,
            { origin: event.origin },
            event
          );

          events.push(event);
        }
      } catch(err) {
        console.log(err);
      }
    }
  } catch (e) {
    console.error(`[run] - ${e}`);
  } finally {
    console.log(
      `... end cron (${Math.floor((new Date().getTime() - start) / 1000)}s)`
    );
    return events;
  }
}

import axios from 'axios';
import packageConfig, { Config } from './config';
import { DatabaseConnection, connectToDatabase } from 'db-connector';
import { put } from 'base-lambda';
import { CreateEventDto, CalendarEvent, Kind } from 'calendar-events';

const pageSize = 20;
let config = packageConfig;

const mappeur = (entrie: Record<string, string>): CreateEventDto => ({
  // : entrie.DateCreated, //:'2021-05-18 09:08:30',
  updatedAt: entrie.DateUpdated.length > 0 ? new Date(entrie.DateUpdated) : undefined,
  origin: `form/${entrie.EntryId}`,
  name: entrie.Field14, //: "Nom de l'événement",
  departement: entrie.Field2, //:	"Département",
  organisateur: entrie.Field12, //: "Nom de l'organisateur",
  contact: entrie.Field13, //: "Contact",
  website: entrie.Field4, //:	"Site Web",
  description: entrie.Field5, //:	"Description",
  city: entrie.Field9, //:	"ville",
  date: new Date(entrie.Field8), //:	"Date",
  hour: entrie.Field7, //:	"Heure",
  price: entrie.Field11, //: "Prix de l'inscription"
  kind: Kind.VTT,
  canceled: false,
  active: true,
  lock: false,
});

const get = (url: string, params = {}) =>
  axios.get(url, {
    auth: { username: config.wufoo.username, password: config.wufoo.password },
    ...params,
  });

const getEventsCount = async (): Promise<number> => {
  try {
    const { data } = await get(`${config.wufoo.domain}/api/v3/forms/${config.wufoo.form}/entries/count.json`);
    return Number(data.EntryCount);
  } catch (err) {
    console.log(err);
    return 0;
  }
};

const getEvents = async (pageStart: number) => {
  const { data } = await get(`${config.wufoo.domain}/api/v3/forms/${config.wufoo.form}/entries.json`, {
    params: {
      pageStart,
      pageSize,
    },
  });

  return (data.Entries as Record<string, string>[]).map((entrie) => mappeur(entrie));
};

const addEvents = async (db: DatabaseConnection, eventsCount: number, counter = 0): Promise<void> => {
  const events = await getEvents(counter);

  for await (const event of events) {
    (await put<CalendarEvent, CreateEventDto>(db, config.serviceName, { origin: event.origin }, event)).match({
      Ok: (ok) => {
        console.log(ok);
      },
      Error: (err) => {
        console.log(err);
      },
    });
  }
  const currentCount = events.length + counter;

  // we recursurvely parse the next items
  if (currentCount < eventsCount) return addEvents(db, eventsCount, currentCount);
  else return;
};

export const runner = async (db: DatabaseConnection, externalConfig?: Config) => {
  if (config) config = externalConfig as Config;
  const eventsCount = await getEventsCount();
  return addEvents(db, eventsCount);
};

export const run = async () =>
  (await connectToDatabase(packageConfig.mongoUrl, packageConfig.moduleName)).match({
    Ok: async (dbConnection) => {
      await runner(dbConnection);
      console.log('[runner] - succeed to get events');
    },
    Error: async (err) => {
      console.log(err);
    },
  });

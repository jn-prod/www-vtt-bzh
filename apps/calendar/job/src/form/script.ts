import packageConfig, { Config } from '../config';
import { scrapper, type IScrapper } from 'request';
import { Db } from 'mongodb-adapter';
import { updateOrCreate } from 'repository';
import { CreateEventDto, CalendarEvent, Kind } from 'calendar-shared';
let config = packageConfig;

const mappeur = (entrie: unknown): CreateEventDto => ({
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

const getEvents = async <T>(client: IScrapper, totalCount: number, events: T[] = []): Promise<T[]> => {
  const pageSize = 20;
  const eventsCount = events?.length || 0;

  const newEvents = await client(
    '/entries.json',
    {
      params: {
        pageStart: eventsCount,
        pageSize,
      },
    },
    []
  );

  // update events
  events = [...events, ...newEvents];

  // we recursurvely parse the next items
  if ((events?.length || 0) + eventsCount < eventsCount) return getEvents<T>(client, totalCount, events);
  else return events as T[];
};

export const formRunner = async <T>(db: Db, externalConfig?: Config): Promise<void> => {
  if (config) config = externalConfig as Config;
  const auth = { username: config.wufoo.username, password: config.wufoo.password };

  const client = scrapper('API', `${config.wufoo.domain}/api/v3/forms/${config.wufoo.form}`);
  const eventsCount = Number(await client('/entries/count.json', { auth }, 0));

  const events = await getEvents<T>(client, eventsCount);

  events.map(mappeur).forEach(async (event) => {
    await updateOrCreate<CalendarEvent, CreateEventDto>(db, config.serviceName, { origin: event.origin }, event);
  });
};

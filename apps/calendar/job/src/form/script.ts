import packageConfig, { Config } from '../config';
import { scrapper, type IRequest } from 'request';
import { updateOrCreate, type SupabaseClient } from 'repository';
import { CreateEventDto, CalendarEvent, Kind } from 'calendar-shared';
let config = packageConfig;

type Entrie = {
  DateUpdated: string;
  EntryId: string;
  Field1: string;
  Field2: string;
  Field3: string;
  Field4: string;
  Field5: string;
  Field6: string;
  Field7: string;
  Field8: string;
  Field9: string;
  Field10: string;
  Field11: string;
  Field12: string;
  Field13: string;
  Field14: string;
};

const mappeur = <T>(value: T): CreateEventDto | null => {
  if (typeof value === 'object' && value !== null) {
    const entrie = value as unknown as Entrie;
    return {
      // : entrie.DateCreated, //:'2021-05-18 09:08:30',
      updatedAt: entrie.DateUpdated?.length > 0 ? new Date(entrie.DateUpdated) : undefined,
      origin: `form/${entrie.EntryId}`,
      name: entrie.Field14, //: "Nom de l'événement",
      departement: Number(entrie.Field2), //:	"Département",
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
    };
  } else {
    return null;
  }
};

const getEvents = async <T>(client: IRequest, totalCount: number, events: T[] = []): Promise<T[]> => {
  const pageSize = 20;
  const eventsCount = events?.length || 0;

  const data = await client<{ Entries: T[] }>(
    '/entries.json',
    {
      params: {
        pageStart: eventsCount,
        pageSize,
      },
    },
    []
  );
  const newEvents = data?.Entries as T[];

  // update events
  events = Array.isArray(newEvents) ? [...events, ...newEvents] : events;

  // we recursurvely parse the next items
  if (events.length < totalCount) return getEvents<T>(client, totalCount, events);
  else return events as T[];
};

export const formRunner = async <T>(client: SupabaseClient, externalConfig?: Config): Promise<void> => {
  if (config) config = externalConfig as Config;

  // const client = scrapper('API', `${config.wufoo.domain}/api/v3/forms/${config.wufoo.form}`, {
  //   username: config.wufoo.username,
  //   password: config.wufoo.password,
  // });
  // const data = await client<{ EntryCount: string }>('/entries/count.json', {}, 0);
  // console.log(data?.EntryCount);

  // const events = await getEvents<T>(client, Number(data?.EntryCount));
  const events = [{ EntryId: '53', Field14: 'test' }];

  await Promise.all(
    events.map((event) => {
      const mappedEvent = mappeur(event) || ({} as CreateEventDto);
      updateOrCreate<CalendarEvent, CreateEventDto>(
        client,
        config.supabase.table,
        [{ column: 'origin', operator: 'eq', value: mappedEvent.origin }],
        { name: 'test', kind: Kind.VTT, lock: false } //mappedEvent
      );
    })
  ).catch((err) => {
    console.log(err);
  });
};

import packageConfig, { Config } from '../config';
import type { Entrie } from './types';
import { client as httpClient, type IRequest } from 'http-client';
import { updateOrCreate, type SupabaseClient } from 'repository';
import { CreateEventDto, CalendarEvent, Kind } from 'calendar-shared';
let config = packageConfig;

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
  let entries: T[];

  const res = await client<{ Entries: T[] }>('/entries.json', {
    params: {
      pageStart: eventsCount,
      pageSize,
    },
  } as RequestInit);
  if (res.ok) entries = (res.value as { Entries: T[] }).Entries;
  else entries = [];
  const newEvents = entries;

  // update events
  events = Array.isArray(newEvents) ? [...events, ...newEvents] : events;

  // we recursurvely parse the next items
  if (events.length < totalCount) return getEvents<T>(client, totalCount, events);
  else return events;
};

export const formRunner = async <T>(db: SupabaseClient, externalConfig?: Config): Promise<void | void[]> => {
  if (config) config = externalConfig as Config;

  const client = httpClient(`${config.wufoo.domain}/api/v3/forms/${config.wufoo.form}`, {
    username: config.wufoo.username,
    password: config.wufoo.password,
  });
  const data = await client<{ EntryCount: string }>('/entries/count.json', {});

  if (!data.ok) return;

  const events = await getEvents<T>(client, Number((data.value as { EntryCount: string }).EntryCount));

  return Promise.all(
    events.map((event) => {
      const mappedEvent = mappeur(event) || ({} as CreateEventDto);
      updateOrCreate<CalendarEvent, CreateEventDto>(
        db,
        config.supabase.table,
        [{ column: 'origin', operator: 'eq', value: mappedEvent.origin }],
        mappedEvent
      );
    })
  ).catch((err) => {
    console.error('[job] formRunner', err);
  });
};

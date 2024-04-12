import { dbConnection } from '../lib/repository';
import { find, type Filter } from 'repository';
import type { CalendarEvent } from 'calendar-shared/src/types';

type SearchType = {
  from: Date;
  to: Date;
  where: number;
};

const serviceName = 'events';

const fetchSearch = async ({ from, to, where }: SearchType): Promise<CalendarEvent[]> => {
  const projection = [
    'date',
    'place',
    'name',
    'contact',
    'price',
    'canceled',
    'departement',
    'hour',
    'organisateur',
    'city',
    'description',
  ].join(',');

  let query: Filter[] = [{ column: 'active', operator: 'eq', value: true }];
  if (from) query.push({ column: 'date', operator: 'gte', value: from });
  if (to) query.push({ column: 'date', operator: 'lte', value: to });
  if (where) query.push({ column: 'departement', operator: 'eq', value: where });
  const res = await find<CalendarEvent>(dbConnection, serviceName, query, projection, {
    order: {
      column: 'date',
      ascending: true,
    },
  });
  if (res.ok) return res.value;
  else return [];
};

export default {
  fetchSearch,
};

import { supabase } from '../lib/supabase';
import type { Result } from 'utils/src';

type SearchType = {
  from: Date;
  to: Date;
  where: number;
};

const fetchSearch = async ({ from, to, where }: SearchType): Promise<Result<unknown>> => {
  try {
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

    let query = supabase.from('events').select(projection);

    if (from) query = query.filter('date', 'gte', from);
    if (to) query = query.filter('date', 'lte', to);
    if (where) query = query.filter('departement', 'eq', where);

    const { data, error } = await query;

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

export default {
  fetchSearch,
};

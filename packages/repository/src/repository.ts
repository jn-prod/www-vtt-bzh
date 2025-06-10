import { Err, type Result, encaseResult, Ok, Maybe } from 'types';
import { DbClientError } from './errors';
import type { SupabaseClient, SupabaseConfig, Filter, FilterOption } from './types';

type DatabaseClient = SupabaseClient | unknown;
type ServiceName = SupabaseConfig['table'];

const isSupabaseClient = (db: unknown): db is SupabaseClient => typeof db === 'object';

export const find = async <T>(
  db: DatabaseClient,
  collection: ServiceName,
  filter: Filter[] = [],
  projection = '*',
  options?: Partial<FilterOption>
): Promise<Result<T[]>> => {
  if (!isSupabaseClient(db)) return Err(new DbClientError());
  return encaseResult<T[]>(async () => {
    const query = db.from(collection).select(projection);
    filter.forEach((entrie) => {
      query.filter(entrie.column, entrie.operator, entrie.value);
    });
    if (options && options.order) {
      query.order(options.order.column, { ascending: options.order.ascending });
    }
    return (await query).data as T[];
  });
};

export const findOne = async <T>(
  db: DatabaseClient,
  collection: ServiceName,
  filter: Filter[] = [],
  projection = '*'
): Promise<Result<Maybe<T>>> => {
  if (!isSupabaseClient(db)) return Err(new DbClientError());
  return encaseResult<T | null>(async () => {
    const res = await find(db, collection, filter, projection);
    if (res.ok && res.value.length > 0) return res.value[0] as T;
    else return null;
  });
};

export const findOneById = async <T>(
  db: DatabaseClient,
  collection: ServiceName,
  resource: string,
  projection = '*'
): Promise<Result<Maybe<T>>> =>
  findOne<T>(db, collection, [{ column: 'id', operator: 'eq', value: resource }], projection);

export const create = async <CreateDto, T>(
  db: DatabaseClient,
  collection: ServiceName,
  resource: CreateDto
): Promise<Result<Maybe<T>>> => {
  if (!isSupabaseClient(db)) return Err(new DbClientError());

  return encaseResult(async () => {
    const { data, error } = await db.from(collection).insert(resource).select();
    if (error) console.error(`[repository] create`, error);
    if (data && data?.length > 0) return data[0] as T;
    else return null;
  });
};

export const updateOne = async <UpdateDto, T>(
  db: DatabaseClient,
  collection: ServiceName,
  filter: Filter[] = [],
  resource: UpdateDto
): Promise<Result<Maybe<T>>> => {
  if (!isSupabaseClient(db)) return Err(new DbClientError());

  return encaseResult(async () => {
    const res = await findOne<T & { lock: boolean; id: string }>(db, collection, filter);
    // update entity if NOT locked
    if (res.ok && res.value !== null && res.value.lock !== true) {
      const { data: updateRes, error } = await db.from(collection).update(resource).eq('id', res.value.id).select();
      if (error) console.error(`[repository] updateOne`, error);
      if (updateRes !== null) return updateRes[0] as T;
      else return null;
    } else if (res.ok) return res.value as T;
    else return null;
  });
};

export const updateOrCreate = async <UpdateDto, T>(
  db: DatabaseClient,
  collection: ServiceName,
  filter: Filter[] = [],
  resource: UpdateDto
): Promise<Result<Maybe<T>>> => {
  const res = await updateOne<UpdateDto, T>(db, collection, filter, resource);
  if (res.ok && res.value) return Ok<T>(res.value);
  else {
    const resCreate = await create<UpdateDto, T>(db, collection, resource);
    if (resCreate.ok) return Ok<Maybe<T>>(resCreate.value);
    else return Err(resCreate.error);
  }
};

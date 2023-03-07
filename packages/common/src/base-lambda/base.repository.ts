import { Result } from '@swan-io/boxed';
import { Document, SortDirection, UpdateResult } from 'mongodb';
import { queryParser, getProjection } from 'utils';
import { ServiceName } from './base.conf';
import { DbClientError } from '../db/errors';
import { DatabaseConnection } from '../db/client';

export type ID = string;

export const find = async <T>(
  db: DatabaseConnection,
  collection: ServiceName,
  projection = '',
  limit = 0,
  skip = 0,
  sort = '',
  filter = ''
): Promise<Result<T[], Error>> => {
  if (db === null || db === undefined) {
    return Result.Error(new DbClientError());
  }
  try {
    const res = (await db
      .collection(collection)
      .find(queryParser(filter), { projection: getProjection(projection) })
      .skip(skip)
      .limit(limit)
      .sort(queryParser(sort) as unknown as [string, SortDirection])
      .toArray());
    return Result.Ok(res as T[]);
  } catch (err) {
    return Result.Error(err as Error);
  }
};

export const findOne = async <T>(
  db: DatabaseConnection,
  collection: ServiceName,
  resource: string,
  projection = '',
  filter = {}
): Promise<Result<T | null, Error>> => {
  if (db === null || db === undefined) {
    return Result.Error(new DbClientError());
  }
  try {
    const res = await db.collection(collection).findOne({ _id: resource, ...filter }, getProjection(projection));
    if (res?._id) return Result.Ok(res as T);
    else return Result.Ok(null);
  } catch (err) {
    return Result.Error(err as Error);
  }
};

export const create = async <CreateDto extends Document, T>(
  db: DatabaseConnection,
  collection: ServiceName,
  resource: CreateDto
): Promise<Result<T, Error>> => {
  if (db === null || db === undefined) {
    return Result.Error(new DbClientError());
  }
  try {
    const { insertedId } = await db.collection(collection).insertOne(resource);
    return Result.Ok({ _id: insertedId } as T);
  } catch (err) {
    return Result.Error(err as Error);
  }
};

export const updateOne = async <UpdateDto extends Document, T>(
  db: DatabaseConnection,
  collection: ServiceName,
  filter = {},
  resource: UpdateDto
): Promise<Result<T | null, Error>> => {
  if (db === null || db === undefined) {
    return Result.Error(new DbClientError());
  }
  try {
    const isLock = await db.collection(collection).findOne({ ...filter, lock: true }, { projection: {_id: 1} }) !== null;
    if (!isLock) {
      const { value } = await db.collection(collection).findOneAndUpdate({ ...filter }, { $set: resource }, { projection: {_id: 1} });
      return Result.Ok(value as T | null);
    } else {
      return Result.Ok(null);
    }
  } catch (err) {
    return Result.Error(err as Error);
  }
}

export const updateById = async <UpdateDto extends Document, T>(
  db: DatabaseConnection,
  collection: ServiceName,
  id: ID,
  resource: UpdateDto
): Promise<Result<T | null, Error>> => (await updateOne<UpdateDto, T>(db, collection, { _id: id }, resource)).match({
    Ok: res => Result.Ok({...res } as T),
    Error: (err: Error) => Result.Error(err as Error)
  });

export const updateOrCreate = async <UpdateDto extends Document, T>(
  db: DatabaseConnection,
  collection: ServiceName,
  filter = {},
  resource: UpdateDto
): Promise<Result<T| null, Error>> => (await updateOne<UpdateDto, T>(db, collection, { ...filter }, resource)).match({
    Ok: async updated => {
      if (updated !== null) {
        return Result.Ok(updated as T);
      } else {
        return (await create<UpdateDto, T>(db, collection, resource)).match({
          Ok: inserted => {
            return Result.Ok(inserted as T)
          },
          Error: (err: Error) =>  Result.Error(err as Error)
        });
      }
    },
    Error: async (err: Error) => Result.Error(err as Error)
  });

export const remove = <T>(db: DatabaseConnection, collection: ServiceName, id: ID): Promise<unknown | null> =>
  db?.collection(collection).findOneAndDelete({ _id: id }) as unknown as Promise<T>;

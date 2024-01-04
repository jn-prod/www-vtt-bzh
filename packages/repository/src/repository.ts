import { Result } from '@swan-io/boxed';
import { DbClientError } from './errors';
import { find as mongoFind, findOne as mongoFindOne, insertOne } from 'mongodb-adapter';
import type { Db, ServiceName } from 'mongodb-adapter';

type DatabaseClient = Db | unknown;

const isMongodbClient = (db: unknown): db is Db => typeof db !== 'object' && (db as Db)?.collection === undefined;

export const find = async <T>(
  db: DatabaseClient,
  collection: ServiceName,
  projection = '',
  limit = 0,
  skip = 0,
  sort = '',
  filter = ''
): Promise<Result<T[], Error>> => {
  if (!isMongodbClient(db)) return Result.Error(new DbClientError());

  try {
    return Result.Ok(await mongoFind<T>(db, collection, projection, limit, skip, sort, filter));
  } catch (err) {
    return Result.Error(err as Error);
  }
};

export const findOne = async <T>(
  db: DatabaseClient,
  collection: ServiceName,
  resource: string,
  projection = '',
  filter = {}
): Promise<Result<T | null, Error>> => {
  if (!isMongodbClient(db)) return Result.Error(new DbClientError());

  try {
    const res = await mongoFindOne<T>(db, collection, { _id: resource, ...filter }, projection);
    if (res?._id) return Result.Ok(res);
    else return Result.Ok(null);
  } catch (err) {
    return Result.Error(err as Error);
  }
};

export const create = async <CreateDto, T>(
  db: DatabaseClient,
  collection: ServiceName,
  resource: CreateDto
): Promise<Result<T, Error>> => {
  if (!isMongodbClient(db)) return Result.Error(new DbClientError());

  try {
    const { insertedId } = await insertOne<CreateDto, T>(db, collection, resource);
    return Result.Ok({ _id: insertedId } as unknown as T);
  } catch (err) {
    return Result.Error(err as Error);
  }
};

export const updateOne = async <UpdateDto, T>(
  db: DatabaseClient,
  collection: ServiceName,
  filter = {},
  resource: UpdateDto
): Promise<Result<T | null, Error>> => {
  if (!isMongodbClient(db)) return Result.Error(new DbClientError());

  try {
    const entity = await mongoFindOne(db, collection, { ...filter, lock: true });
    // update entity if NOT locked
    if (entity === null) {
      const value = await updateOne<UpdateDto, T>(db, collection, filter, resource);
      return Result.Ok(value as T | null);
    } else {
      return Result.Ok(entity as T);
    }
  } catch (err) {
    return Result.Error(err as Error);
  }
};

export const updateOrCreate = async <UpdateDto, T>(
  db: DatabaseClient,
  collection: ServiceName,
  filter = {},
  resource: UpdateDto
): Promise<Result<T | null, Error>> =>
  (await updateOne<UpdateDto, T>(db, collection, { ...filter }, resource)).match({
    Ok: async (updated) => {
      if (updated !== null) {
        return Result.Ok(updated as T);
      } else {
        return (await create<UpdateDto, T>(db, collection, resource)).match({
          Ok: (inserted) => {
            return Result.Ok(inserted as T);
          },
          Error: (err: Error) => Result.Error(err as Error),
        });
      }
    },
    Error: async (err: Error) => Result.Error(err as Error),
  });

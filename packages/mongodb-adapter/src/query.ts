import { queryParser, projectionParser, sortParser } from './parser';
import type { Db, Condition, ObjectId, OptionalId, MatchKeysAndValues } from 'mongodb';

export type ServiceName = string;

export const find = async <T>(
  db: Db,
  collection: ServiceName,
  projection = '',
  limit = 0,
  skip = 0,
  sort = '',
  filter = ''
): Promise<T[]> => {
  const filterQuery = { ...queryParser(filter), active: { $ne: false } };

  const res = await db
    .collection(collection)
    .find(filterQuery, { projection: projectionParser(projection) })
    .skip(skip)
    .limit(limit)
    .sort(sortParser(sort))
    .toArray();

  return res as T[];
};

export const findOne = async <T>(
  db: Db,
  collection: ServiceName,
  filter = {},
  projection = ''
): Promise<T & { _id: string }> =>
  db.collection(collection).findOne(filter, projectionParser(projection)) as unknown as T & {
    _id: string;
  };

export const insertOne = async <CreateDto, T>(
  db: Db,
  collection: ServiceName,
  resource: CreateDto
): Promise<T & { insertedId: string }> =>
  db.collection(collection).insertOne(resource as OptionalId<Document>) as unknown as T & { insertedId: string };

export const updateOne = async <UpdateDto, T>(
  db: Db,
  collection: ServiceName,
  filter = {},
  resource: UpdateDto
): Promise<T> =>
  db
    .collection(collection)
    .findOneAndUpdate(
      { ...filter },
      { $set: resource as MatchKeysAndValues<Document> },
      { projection: { _id: 1 } }
    ) as T;

export const remove = <T>(db: Db, collection: ServiceName, id: string): Promise<unknown | null> =>
  db?.collection(collection).findOneAndDelete({
    _id: id as unknown as Condition<ObjectId>,
  });

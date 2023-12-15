import { Result } from '@swan-io/boxed';
import { MongoClient, Db } from 'mongodb';
import { DbClientError } from './errors';

export type DatabaseConnection = Db | null;
export type MongoUrl = string;

let cachedDb: DatabaseConnection = null;

export const connectToDatabase = async (
  mongoUrl: MongoUrl,
  dbName: string
): Promise<Result<DatabaseConnection, Error>> => {
  if (cachedDb) {
    return Result.Ok(cachedDb);
  }

  try {
    const client = await MongoClient.connect(mongoUrl);
    const db = await client.db(dbName);
    cachedDb = db;
    return Result.Ok(db);
  } catch (err) {
    return Result.Error(new DbClientError((err as Error).message));
  }
};

export const closeDbConnection = async (): Promise<void> => {
  if (cachedDb !== null) {
    console.warn('[client] - mongodb connection is already closed');
  } else {
    console.info('[client] - close mongodb connection');

    await (cachedDb as unknown as MongoClient).close();
    cachedDb = null;
  }
};

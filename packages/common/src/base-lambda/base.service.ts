import { Result } from '@swan-io/boxed';
import { Document } from 'mongodb';
import { find, findOne, create, updateById, remove, updateOrCreate } from './base.repository';
import { ServiceName } from './base.conf';
import { NotFoundError } from './base.errors';
import { IQueryPagination } from 'utils';
import { DatabaseConnection } from '../db/client';

export const getAll = async <T>(
  db: DatabaseConnection,
  serviceName: ServiceName,
  { limit, skip, sort, filter, projection }: IQueryPagination
): Promise<Result<T[], Error>> => {
  const res = await find<T>(db, serviceName, projection, limit, skip, sort, filter);
  return res.match({
    Ok: (value) => Result.Ok(value),
    Error: (error) => {
      console.error(error);
      return Result.Error(error);
    },
  });
};

export const post = async <T, TDto extends Document>(
  db: DatabaseConnection,
  serviceName: ServiceName,
  createEventDto: TDto
): Promise<Result<T, Error>> => {
  const res = await create<TDto, T>(db, serviceName, createEventDto);
  return res.match({
    Ok: (value) => Result.Ok(value),
    Error: (error) => {
      console.error(error);
      return Result.Error(error);
    },
  });
};

export const put = async <T, UDto extends Document>(
  db: DatabaseConnection,
  serviceName: ServiceName,
  filter: Record<string, unknown>,
  updateEventDto: UDto
): Promise<Result<T | null, Error>> => {
  return (await updateOrCreate<UDto, T>(db, serviceName, filter, updateEventDto)).match({
    Ok: (value) => Result.Ok(value),
    Error: (error) => Result.Error(error),
  });
};

export const getOne = async <T>(
  db: DatabaseConnection,
  serviceName: ServiceName,
  entityId: string,
  query: IQueryPagination
): Promise<Result<T, Error>> => {
  const { projection } = query;
  return (await findOne<T>(db, serviceName, entityId, projection, query)).match({
    Ok: (event) => {
      if (event) {
        return Result.Ok(event);
      } else {
        return Result.Error(new NotFoundError(`Event #${entityId} not found`));
      }
    },
    Error: (err) => Result.Error(err),
  });
};

// export const patchById = async <T, UDto>(
//   db: DatabaseConnection,
//   serviceName: ServiceName,
//   entityId: string,
//   updateEventDto: UDto
// ): Promise<T | Error> => {
//   const event = await updateById<UDto, T>(db, serviceName, entityId, updateEventDto);

//   if (!event) {
//     return new NotFoundError(`Event #${entityId} not found`);
//   }

//   return event;
// };

export const deleteOne = (db: DatabaseConnection, serviceName: ServiceName, entityId: string): Promise<unknown> =>
  remove(db, serviceName, entityId);

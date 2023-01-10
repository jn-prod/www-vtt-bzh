import { Document } from 'mongodb';
import { connectToDatabase } from '../db/client';
import { jsonParse } from 'utils';
import { BaseConfig } from './base.conf';
import { formatResponse, IHandler } from './base.handler';
import { getAll, post } from './base.service';

export const getController =
  <T>(config: BaseConfig): IHandler =>
  async (event) => (await connectToDatabase(config.mongoUrl, config.moduleName)).match({
    Ok: async (db) =>
      (await getAll<T>(db, config.serviceName, event?.queryStringParameters || {})).match({
        Ok: (datas) => formatResponse(200, 'GET', { datas, count: datas?.length }),
        Error: (err) => formatResponse(500, 'GET', { err }),
      }),
    Error: async (err) => formatResponse(500, 'GET', { err }),
  });

export const postController =
  <T, CreateDto extends Document>(
    config: BaseConfig,
    validationFn: (payload: Record<string, unknown>) => payload is CreateDto
  ): IHandler =>
  async (event) =>
    jsonParse(event?.body || '').match({
      Ok: async (payload:Record<string, unknown>) => {
        if (validationFn(payload)) {
          return (await connectToDatabase(config.mongoUrl, config.moduleName)).match({
            Ok: async (db) =>
              (await post<T, CreateDto>(db, config.serviceName, payload)).match({
                Ok: (event) => formatResponse(201, 'POST', { data: event }),
                Error: (err) => formatResponse(500, 'POST', { err }),
              }),
            Error: async (err) => formatResponse(500, 'POST', { err }),
          });
        } else return formatResponse(500, 'POST', { message: 'invalid payload' });
      },
      Error: async (err: Error) => formatResponse(500, 'GET', { err }),
    });

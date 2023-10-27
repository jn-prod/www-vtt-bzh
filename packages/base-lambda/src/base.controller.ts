import { connectToDatabase, Document } from 'db-connector';
import { jsonParse } from 'utils/src';
import { Config } from './base.conf';
import { formatResponse, IHandler } from './base.handler';
import { getAll, post } from './base.service';

export const getController =
  <T>(config: Config): IHandler =>
  async (event) =>
    (await connectToDatabase(config.mongoUrl, config.moduleName)).match({
      Ok: async (db) =>
        (await getAll<T>(db, config.serviceName, event?.queryStringParameters || {})).match({
          Ok: (datas) => formatResponse(200, 'GET', { datas, count: datas?.length }, config.baseUrl),
          Error: (err) => formatResponse(500, 'GET', { err }, config.baseUrl),
        }),
      Error: async (err) => formatResponse(500, 'GET', { err }, config.baseUrl),
    });

export const postController =
  <T, CreateDto extends Document>(
    config: Config,
    validationFn: (payload: Record<string, unknown>) => payload is CreateDto
  ): IHandler =>
  async (event) =>
    jsonParse(event?.body || '').match({
      Ok: async (payload: Record<string, unknown> | string) => {
        if (typeof payload === 'object' && validationFn(payload)) {
          return (await connectToDatabase(config.mongoUrl, config.moduleName)).match({
            Ok: async (db) =>
              (await post<T, CreateDto>(db, config.serviceName, payload)).match({
                Ok: (event) => formatResponse(201, 'POST', { data: event }, config.baseUrl),
                Error: (err) => formatResponse(500, 'POST', { err }, config.baseUrl),
              }),
            Error: async (err) => formatResponse(500, 'POST', { err }, config.baseUrl),
          });
        } else return formatResponse(500, 'POST', { message: 'invalid payload' }, config.baseUrl);
      },
      Error: async (err: Error) => formatResponse(500, 'GET', { err }, config.baseUrl),
    });

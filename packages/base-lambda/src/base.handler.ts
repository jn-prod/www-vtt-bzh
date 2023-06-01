import { Context, APIGatewayEvent } from 'aws-lambda';
import { Config } from './base.conf';

type StatusCode = 200 | 201 | 404 | 500;

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface IHttpResponse {
  headers: IHeaderOption;
  statusCode: StatusCode;
  body: string;
}

interface IHeaderOption {
  'Content-Type': 'application/json';
  'Access-Control-Allow-Origin'?: string;
  'Access-Control-Allow-Methods'?: Method;
  'Access-Control-Allow-Credentials'?: boolean;
}

export interface IHandler {
  (event?: APIGatewayEvent, context?: Context): Promise<IHttpResponse>;
}

export const formatResponse = <T>(
  statusCode: StatusCode,
  method: Method,
  payload: T,
  baseUrl?: Config['baseUrl']
): IHttpResponse => ({
  statusCode: statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': baseUrl || '*',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Methods': method,
  },
  body: JSON.stringify(payload),
});

export const healthcheck: IHandler = async () => formatResponse(200, 'GET', 'OK');

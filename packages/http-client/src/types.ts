import type { Result } from 'types';

export type Auth = { username: string; password: string };

export type RequestOptions = RequestInit & {
  params?: Record<string, string>;
  responseType?: 'arrayBuffer' | 'json' | 'text';
};

export interface IRequest {
  <T>(uri: string, options?: RequestOptions): Promise<Result<T | ArrayBuffer | string>>;
}

export interface IClient {
  (baseUrl: string, auth?: Auth): IRequest;
}

import { Result, encaseResult } from 'types';
import { Auth, IClient, RequestOptions } from './types';

const isAuth = (auth: unknown): auth is Auth =>
  auth !== undefined &&
  typeof auth === 'object' &&
  ['username', 'password'].every((key) => Object.keys(auth as Auth).includes(key));

const request = async <T>(
  baseURL: string,
  uri: string,
  options: RequestOptions = {}
): Promise<Result<T | ArrayBuffer | string>> => {
  return encaseResult<T | ArrayBuffer | string>(async () => {
    let url = encodeURI(baseURL + uri);
    if (options.params && Object.keys(options.params).length > 0) {
      url += `?${new URLSearchParams(options.params).toString()}`;
    }
    const res = await fetch(new Request(url, options));
    let response;
    if (options.responseType === 'arrayBuffer') {
      response = await res.arrayBuffer();
      return response;
    } else if (options.responseType === 'text') {
      response = await res.text();
      return response;
    } else {
      response = await res.json();
      return response as T;
    }
  });
};

export const client: IClient =
  (baseUrl, auth) =>
  (uri, options = {}) =>
    request(baseUrl, uri, {
      ...options,
      headers: new Headers({
        ...options.headers,
        Authorization: isAuth(auth) ? `Basic ${btoa(auth.username + ':' + auth.password)}` : '',
      }),
    });

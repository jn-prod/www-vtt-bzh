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
    // set clean url
    const url = new URL(encodeURI([baseURL, uri.split('?')[0]].join('')));

    // set search params
    if (options.params && Object.keys(options.params).length > 0) {
      url.search = new URLSearchParams(options.params).toString();
    }

    // fetch query
    const response = await fetch(new Request(url.toString(), options));

    // set result value
    let result;
    if (options.responseType === 'arrayBuffer') {
      result = await response.arrayBuffer();
      return result;
    } else if (options.responseType === 'text') {
      result = await response.text();
      return result;
    } else {
      result = await response.json();
      return result as T;
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

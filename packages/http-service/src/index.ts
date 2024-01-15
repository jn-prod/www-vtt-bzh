import type { Result } from 'types';
import { encaseResult } from 'types';
import axios, { type AxiosRequestConfig } from 'axios';

export const get = async <T>(baseURL: string, uri: string): Promise<Result<T>> => {
  const res = await fetch(encodeURI(baseURL + uri));
  return encaseResult<T>(() => res.json() as T);
};

export interface IRequest {
  <T>(url: string, request: AxiosRequestConfig, defaultValue: unknown): Promise<T | null>;
}

export interface IScrapper {
  (mode: 'API' | 'DOM', baseUrl: string, auth: { username: string; password: string }): IRequest;
}

export const scrapper: IScrapper =
  (mode, baseUrl, auth) =>
  async (url, request = {}, defaultValue = null) => {
    switch (mode) {
      case 'API':
        try {
          const res = await axios.get(baseUrl + url, { auth, ...request });
          return res.data;
        } catch (err) {
          console.log(err);
          return defaultValue;
        }
      case 'DOM':
        return 'TODO';
    }
  };

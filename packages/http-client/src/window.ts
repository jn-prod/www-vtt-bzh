import { type Maybe } from 'types';
import { parseHTML } from 'linkedom';
import { type StringOrBufferType } from './client';

export const createWindow = (
  init: StringOrBufferType,
  config?: { decode?: 'iso-8859-1' | string; cleanText?: boolean }
): Maybe<Window> => {
  let value = init;

  // decode value
  if (typeof config?.decode === 'string' && typeof value === typeof Buffer.from('')) {
    value = new TextDecoder(config?.decode).decode(value as unknown as ArrayBuffer).toString();
  }

  // clean value, replace '\n','\r','\r\n' text to " "
  if (typeof value === 'string' && config?.cleanText) {
    value = value.replaceAll(/(\r\n|\n|\r)/gm, ' ');
  }

  return parseHTML(value);
};

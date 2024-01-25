export const decode = (text: Buffer, from: 'iso-8859-1' | string): string => new TextDecoder(from).decode(text);

export const decodeAndClean = (text: Buffer, from: 'iso-8859-1' | string): string =>
  decode(text, from).replaceAll(/(\r\n|\n|\r)/gm, ' '); // convert '\n','\r','\r\n' text to " "

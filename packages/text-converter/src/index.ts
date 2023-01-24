import iconv from 'iconv-lite';

export const decode = (buffer: Buffer, encoding: string): string => iconv.decode(buffer, encoding); 
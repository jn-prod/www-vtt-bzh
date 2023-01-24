import { range } from './array';

export const generateID = (length = 12): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return range(0, length)
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join('');
};

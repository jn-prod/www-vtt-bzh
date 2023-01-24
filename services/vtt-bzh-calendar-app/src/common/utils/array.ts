export const range = (start: number, end: number): any[] => {
  return Array.from({ length: end - start + 1 }, (_, i) => i);
};

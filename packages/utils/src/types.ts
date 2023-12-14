export type Result<T> = {
  data: T | null;
  error: unknown | null;
};

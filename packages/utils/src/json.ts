import { Result } from '@swan-io/boxed';

export const jsonParse = (json: string): Result<Record<string, unknown> | string, Error> => {
  try {
    const res = JSON.parse(json);
    return Result.Ok(res);
  } catch (err) {
    return Result.Error(err as Error);
  }
};

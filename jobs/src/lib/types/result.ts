export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E = Error> = Ok<T> | Err<E>;
export const Ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const Err = <E>(error: E): Err<E> => ({ ok: false, error });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const encaseResult = async <T, E extends Error = Error>(fn: () => T | Promise<T>): Promise<Result<T>> => {
  try {
    const data = await fn();
    return Ok<T>(data);
  } catch (err) {
    return Err<E>(err as E);
  }
};

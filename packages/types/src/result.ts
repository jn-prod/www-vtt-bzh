export type Result<T, E = Error> = { ok: boolean; value?: T; error?: E };

const _ok = <T>(value: T): Result<T> => ({
  ok: true,
  value,
});

const _err = <E>(error: E): Result<never, E> => ({
  ok: false,
  error,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const encaseResult = <T, E extends Error = Error>(fn: () => T): Result<T> => {
  try {
    return _ok(fn());
  } catch (err) {
    return _err<E>(err as E);
  }
};

export interface Matchers<T, E extends Error, R1, R2> {
  ok(value: T): R1;
  err(error: E): R2;
}

export const match =
  <T, E extends Error, R1, R2>(matchers: Matchers<T, E, R1, R2>) =>
  (result: Result<T, E>) =>
    result.ok === true && result.value !== undefined
      ? matchers.ok(result.value)
      : matchers.err(result.error || (new Error('Default error') as E));

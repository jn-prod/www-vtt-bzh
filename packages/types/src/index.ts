export type Result<T, E> = { ok: T | null; err: E | null };

export class NotFoundError extends Error {
  constructor(private readonly msg: string) {
    super(msg);
  }
}

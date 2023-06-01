export class NotFoundError extends Error {
  constructor(private readonly msg: string) {
    super(msg);
  }
}

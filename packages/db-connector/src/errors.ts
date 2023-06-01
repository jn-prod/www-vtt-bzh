export class DbClientError extends Error {
  constructor(readonly message = 'fail to connect ton mongo') {
    super(message);
  }
}

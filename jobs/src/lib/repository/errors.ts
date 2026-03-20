export class DbClientError extends Error {
  constructor(readonly message = 'fail to connect ton database') {
    super(message);
  }
}

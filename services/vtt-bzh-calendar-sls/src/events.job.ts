import { DatabaseConnection } from 'db-connector';
import { runner as webRunner } from 'web-scrapper';
import { runner as formRunner } from 'form-scrapper';
import { Config } from './config';

export const runner = async (db: DatabaseConnection, config: Config) => {
  let result = 'OK';
  try {
    await formRunner(db, config);
  } catch (err) {
    console.log(err);
    result = 'FORM_RUNNER_KO';
  }
  try {
    await webRunner(db, config);
  } catch (err) {
    console.log(err);
    result = 'WEB_RUNNER_KO';
  }
  return result;
};

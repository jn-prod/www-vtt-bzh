import { connectToDatabase, type Db } from 'mongodb-adapter';

import dotenv from 'dotenv';

dotenv.config();

import { webRunner } from './web';
// import { formRunner } from './form';
import config from './config';

export const runner = async (db: Db) => {
  let result = 'OK';
  // try {
  //   await formRunner(db, config);
  // } catch (err) {
  //   console.log(err);
  //   result = 'FORM_RUNNER_KO';
  // }
  try {
    await webRunner(db, config);
  } catch (err) {
    console.log(err);
    result = 'WEB_RUNNER_KO';
  }
  return result;
};

const run = async () =>
  (await connectToDatabase(config.mongodb)).match({
    Ok: async (dbConnection) => {
      await runner(dbConnection);
      console.log('[runner] - succeed to get events');
    },
    Error: async (err) => {
      console.log(err);
    },
  });

run();

import dotenv from 'dotenv';

dotenv.config();

import { createClient } from 'repository';
// import { webRunner } from './web';
import { formRunner } from './form';
import config from './config';

const run = () => {
  try {
    const client = createClient(config.supabase.url, config.supabase.key);
    // return Promise.all(formRunner(db, config), webRunner(db, config)]).catch((err) => {
    return Promise.all([formRunner(client, config)]).catch((err) => {
      console.log(err);
    });
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

run();

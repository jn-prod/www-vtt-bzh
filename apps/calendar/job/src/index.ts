import dotenv from 'dotenv';

dotenv.config();

import { createClient } from 'repository';
import { webRunner } from './web';
import { formRunner } from './form';
import config from './config';

const client = createClient(config.supabase.url, config.supabase.key);

const run = (): Promise<void | [void | void[], void]> =>
  Promise.all([formRunner(client, config), webRunner(client, config)])
    .catch((err) => {
      console.error('[job] run', err);
    })
    .finally(() => {
      process.exit();
    });

run();

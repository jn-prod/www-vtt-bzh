import 'dotenv/config';
import { createClient } from 'repository';
import { webRunner } from './runner';

const db = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_KEY as string);

webRunner(db, {
  cronStartUri: process.env.CRON_START_URI as string,
  locale: !!process.env.LOCALE,
  supabase: {
    url: process.env.SUPABASE_URL as string,
    key: process.env.SUPABASE_KEY as string,
    table: process.env.SUPABASE_TABLE as string,
  },
})
  .catch((err) => {
    console.error('[web] run', err);
    throw new Error('Runner error');
  })
  .finally(() => process.exit());

import 'dotenv/config';
import { createClient } from 'repository';
import { formRunner } from './runner';

const db = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_KEY as string);

formRunner(db, {
  supabase: {
    url: process.env.SUPABASE_URL as string,
    key: process.env.SUPABASE_KEY as string,
    table: process.env.SUPABASE_TABLE as string,
  },
  wufoo: {
    username: process.env.WUFOO_USERNAME as string,
    password: process.env.WUFOO_PASSWORD as string,
    domain: process.env.WUFOO_DOMAIN as string,
    form: process.env.WUFOO_FORM as string,
  },
})
  .catch((err) => {
    console.error('[form] run', err);
    throw new Error('Runner error');
  })
  .finally(() => process.exit());

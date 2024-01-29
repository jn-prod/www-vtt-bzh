import { WebConfig } from './web';
import { FormConfig } from './form';
import { SupabaseConfig } from 'repository';

export interface Config extends WebConfig {
  wufoo: FormConfig;
  supabase: SupabaseConfig;
  locale: boolean;
}

const config: Config = {
  locale: !!process.env.LOCALE as boolean,
  cronStartUri: process.env.CRON_START_URI as string,
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
};

export default config;

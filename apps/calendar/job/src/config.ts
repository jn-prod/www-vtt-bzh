import type { Auth, BaseConfig } from 'base-config';
import { WebConfig } from './web';
import { FormConfig } from './form';
import { MongoConfig } from 'mongodb-adapter';

export interface Config extends BaseConfig, WebConfig {
  moduleName: string;
  admin: Auth;
  mongodb: MongoConfig;
  wufoo: FormConfig;
}

const moduleName = 'calendar';

const config: Config = {
  moduleName,
  serviceName: 'event',
  cronStartUri: process.env.CRON_START_URI as string,
  mongodb: {
    dbUrl: process.env.MONGO_URL as MongoConfig['dbUrl'],
    dbName: moduleName + 'event-sls',
  },
  admin: {
    username: process.env.ADMIN_NAME as string,
    password: process.env.ADMIN_PASSWORD as string,
  },
  wufoo: {
    username: process.env.WUFOO_USERNAME as string,
    password: process.env.WUFOO_PASSWORD as string,
    domain: process.env.WUFOO_DOMAIN as string,
    form: process.env.WUFOO_FORM as string,
  },
};

export default config;

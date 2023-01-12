import { BaseConfig, MongoUrl } from 'common';
import { CronStartUri } from './events.job';

export interface Config extends BaseConfig {
  cronStartUri: CronStartUri;
}

const config: Config = {
  moduleName: 'calendar',
  serviceName: 'calendarevent-sls',
  cronStartUri: process.env.CRON_START_URI as CronStartUri,
  mongoUrl: process.env.MONGO_URL as MongoUrl,
  admin: {
    name: process.env.ADMIN_NAME as string,
    password: process.env.ADMIN_PASSWORD as string,
  },
  auth: {
    jwtKey: process.env.JWT_KEY as string,
  },
};

export default config;

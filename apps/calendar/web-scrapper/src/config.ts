import { MongoUrl } from 'db-connector';
import { BaseConfig } from 'base-config';
import { CronStartUri } from './types';

export interface Config extends BaseConfig {
  cronStartUri: CronStartUri;
}

const config: Config = {
  moduleName: 'calendar',
  serviceName: 'calendarevent-sls',
  cronStartUri: process.env.CRON_START_URI as CronStartUri,
  mongoUrl: process.env.MONGO_URL as MongoUrl,
};

export default config;

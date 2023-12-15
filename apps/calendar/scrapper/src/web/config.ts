import { MongoUrl } from 'mongodb-adapter';
import { BaseConfig } from 'base-config';
import { CronStartUri } from './types';

export interface WebConfig extends BaseConfig {
  cronStartUri: CronStartUri;
}

const config: WebConfig = {
  moduleName: 'calendar',
  serviceName: 'calendarevent-sls',
  cronStartUri: process.env.CRON_START_URI as CronStartUri,
  mongoUrl: process.env.MONGO_URL as MongoUrl,
};

export default config;

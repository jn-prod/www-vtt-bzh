import { MongoUrl } from 'mongodb-adapter';
import { Auth, Config as BaseConfig } from 'base-lambda';
import { CronStartUri, Config as ScrapperConfig } from 'web-scrapper';
import { Config as FormConfig } from 'form-scrapper';

export interface Config extends BaseConfig, ScrapperConfig, FormConfig {
  admin: Auth;
  auth: {
    jwtKey: string;
  };
}

const config: Config = {
  moduleName: 'calendar',
  serviceName: 'calendarevent-sls',
  baseUrl: process.env.BASE_URL as string,
  cronStartUri: process.env.CRON_START_URI as CronStartUri,
  mongoUrl: process.env.MONGO_URL as MongoUrl,
  admin: {
    username: process.env.ADMIN_NAME as string,
    password: process.env.ADMIN_PASSWORD as string,
  },
  auth: {
    jwtKey: process.env.JWT_KEY as string,
  },
  wufoo: {
    username: process.env.WUFOO_USERNAME as string,
    password: process.env.WUFOO_PASSWORD as string,
    domain: process.env.WUFOO_DOMAIN as string,
    form: process.env.WUFOO_FORM as string,
  },
};

export default config;

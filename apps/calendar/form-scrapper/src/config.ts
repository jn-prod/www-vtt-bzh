import { BaseConfig } from 'base-config';
import dotenv from 'dotenv';

dotenv.config();

export interface Config extends BaseConfig {
  serviceName: string;
  moduleName: string;
  mongoUrl: string;
  wufoo: {
    username: string;
    password: string;
    domain: string;
    form: string;
  };
}

const config: Config = {
  serviceName: process.env.SERVICE_NAME as string,
  moduleName: process.env.MODULE_NAME as string,
  mongoUrl: process.env.MONGO_URL as string,
  wufoo: {
    username: process.env.WUFOO_USERNAME as string,
    password: process.env.WUFOO_PASSWORD as string,
    domain: process.env.WUFOO_DOMAIN as string,
    form: process.env.WUFOO_FORM as string,
  },
};

export default config;

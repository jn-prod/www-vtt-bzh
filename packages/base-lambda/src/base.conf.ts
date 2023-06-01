import { BaseConfig } from 'base-config';

export interface S3 {
  accessKeyId: string;
  secretAccessKey: string;
}

export interface Config extends BaseConfig {
  baseUrl: string;
}

export { type Auth, type ServiceName } from 'base-config';

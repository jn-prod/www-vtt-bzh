import { MongoUrl } from 'db-connector';

export type ServiceName = string;

export type ModuleName = string;

export interface BaseConfig {
  moduleName: ModuleName;
  serviceName: ServiceName;
  mongoUrl: MongoUrl;
}

export interface Auth {
  username: string;
  password: string;
}

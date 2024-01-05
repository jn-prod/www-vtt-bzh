export type ServiceName = string;

export type ModuleName = string;

export interface BaseConfig {
  serviceName: ServiceName;
}

export interface Auth {
  username: string;
  password: string;
}

export type ServiceName = string;

export type ModuleName = string;

export interface BaseConfig {
  moduleName: ModuleName;
  serviceName: ServiceName;
}

export interface Auth {
  username: string;
  password: string;
}

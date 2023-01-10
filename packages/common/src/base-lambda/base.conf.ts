import { MongoUrl } from "../db";

export type ServiceName = string;

export type ModuleName = string;

export interface S3 {
  accessKeyId: string;
  secretAccessKey: string;
}

export interface Admin {
  name: string;
  password: string;
}

export interface BaseConfig {
  moduleName: ModuleName;
  serviceName: ServiceName;
  mongoUrl: MongoUrl;
  admin: Admin;
  auth: {
    jwtKey: string;
  };
  s3?: S3;
}

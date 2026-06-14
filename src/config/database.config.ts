import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Env, validateEnv } from './env.schema';

type DatabaseEnv = Pick<
  Env,
  'DB_HOST' | 'DB_PORT' | 'DB_USERNAME' | 'DB_PASSWORD' | 'DB_NAME'
>;

export function createDataSourceOptions(
  config: DatabaseEnv,
): DataSourceOptions {
  return {
    type: 'mysql',
    host: config.DB_HOST,
    port: config.DB_PORT,
    username: config.DB_USERNAME,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize: false,
  };
}

export function createTypeOrmOptions(
  config: ConfigService,
): TypeOrmModuleOptions {
  return createDataSourceOptions({
    DB_HOST: config.getOrThrow<string>('DB_HOST'),
    DB_PORT: config.getOrThrow<number>('DB_PORT'),
    DB_USERNAME: config.getOrThrow<string>('DB_USERNAME'),
    DB_PASSWORD: config.getOrThrow<string>('DB_PASSWORD'),
    DB_NAME: config.getOrThrow<string>('DB_NAME'),
  });
}

const env = validateEnv(process.env);

export const dataSource = new DataSource(createDataSourceOptions(env));

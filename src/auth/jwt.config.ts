import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import { Env } from 'src/config/env.schema';

export function createJwtModuleOptions(
  config: ConfigService<Env, true>,
): JwtModuleOptions {
  return {
    global: true,
    secret: config.getOrThrow('JWT_ACCESS_SECRET'),
    signOptions: {
      expiresIn: config.getOrThrow('JWT_ACCESS_EXPIRES_IN'),
    },
  };
}

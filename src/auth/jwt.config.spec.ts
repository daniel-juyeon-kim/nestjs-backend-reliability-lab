import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env.schema';
import { createJwtModuleOptions } from './jwt.config';

describe('createJwtModuleOptions', () => {
  it('ConfigService에서 JWT access token 설정을 읽어온다', () => {
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        const config = {
          JWT_ACCESS_SECRET: 'test-access-secret',
          JWT_ACCESS_EXPIRES_IN: '15m',
        };

        return config[key as keyof typeof config];
      }),
    };

    const result = createJwtModuleOptions(
      configService as unknown as ConfigService<Env, true>,
    );

    expect(configService.getOrThrow).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
    expect(configService.getOrThrow).toHaveBeenCalledWith(
      'JWT_ACCESS_EXPIRES_IN',
    );
    expect(result).toEqual({
      global: true,
      secret: 'test-access-secret',
      signOptions: { expiresIn: '15m' },
    });
  });

  it('JWT access token secret이 없으면 에러를 전파한다', () => {
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') {
          throw new Error('JWT_ACCESS_SECRET is required');
        }

        return '15m';
      }),
    };

    expect(() =>
      createJwtModuleOptions(
        configService as unknown as ConfigService<Env, true>,
      ),
    ).toThrow('JWT_ACCESS_SECRET is required');
  });
});

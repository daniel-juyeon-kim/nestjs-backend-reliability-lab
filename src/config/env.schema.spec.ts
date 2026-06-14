import { validateEnv } from './env.schema';

const validConfig = {
  NODE_ENV: 'test',
  PORT: '3000',
  DB_HOST: 'localhost',
  DB_PORT: '3306',
  DB_USERNAME: 'root',
  DB_PASSWORD: 'password',
  DB_NAME: 'learn_auth',
  JWT_ACCESS_SECRET: 'test-access-secret',
  JWT_ACCESS_EXPIRES_IN: '15m',
};

describe('validateEnv', () => {
  it('JWT access token 설정이 있으면 환경 변수를 검증한다', () => {
    const result = validateEnv(validConfig);

    expect(result.JWT_ACCESS_SECRET).toBe('test-access-secret');
    expect(result.JWT_ACCESS_EXPIRES_IN).toBe('15m');
  });

  it('JWT access token secret이 없으면 에러를 던진다', () => {
    const configWithoutSecret = Object.fromEntries(
      Object.entries(validConfig).filter(
        ([key]) => key !== 'JWT_ACCESS_SECRET',
      ),
    );

    expect(() => validateEnv(configWithoutSecret)).toThrow(
      'Invalid environment variables: JWT_ACCESS_SECRET',
    );
  });
});

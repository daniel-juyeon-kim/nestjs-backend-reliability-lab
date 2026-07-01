import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env.schema';
import { RedisService } from 'src/redis/redis.service';
import { UsersService } from 'src/users/users.service';
import { JwtStrategy } from './jwt.strategy';

type TestUser = {
  id: string;
  email: string;
  passwordHash: string;
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: {
    findById: jest.MockedFunction<(id: string) => Promise<TestUser | null>>;
  };
  let configService: {
    getOrThrow: jest.MockedFunction<(key: string) => string>;
  };
  let redisService: {
    get: jest.MockedFunction<(key: string) => Promise<string | null>>;
  };

  beforeEach(() => {
    usersService = {
      findById: jest.fn(),
    };
    configService = {
      getOrThrow: jest.fn().mockReturnValue('test-access-secret'),
    };
    redisService = {
      get: jest.fn().mockResolvedValue(null),
    };

    strategy = new JwtStrategy(
      usersService as unknown as UsersService,
      configService as unknown as ConfigService<Env, true>,
      redisService as unknown as RedisService,
    );
  });

  it('유효한 payload면 공개 사용자 정보를 반환한다', async () => {
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: 'hashed-password',
    });

    const result = await strategy.validate({
      sub: 'user-1',
      email: 'user@example.com',
      jti: 'access-token-1',
      exp: 1770000000,
    });

    expect(redisService.get).toHaveBeenCalledWith(
      'auth:blacklist:access-token:access-token-1',
    );
    expect(usersService.findById).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      jti: 'access-token-1',
      exp: 1770000000,
    });
  });

  it('payload의 사용자가 없으면 UnauthorizedException을 던진다', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 'missing-user',
        email: 'missing@example.com',
        jti: 'access-token-1',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('blacklist에 있는 access token이면 UnauthorizedException을 던진다', async () => {
    redisService.get.mockResolvedValue('1');

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'user@example.com',
        jti: 'access-token-1',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(usersService.findById).not.toHaveBeenCalled();
  });

  it('blacklist 조회에 실패하면 UnauthorizedException을 던진다', async () => {
    redisService.get.mockRejectedValue(new Error('Redis unavailable'));

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'user@example.com',
        jti: 'access-token-1',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(usersService.findById).not.toHaveBeenCalled();
  });

  it('JWT access token secret을 ConfigService에서 읽어온다', () => {
    expect(configService.getOrThrow).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
  });

  it('JWT access token secret이 없으면 전략 생성에 실패한다', () => {
    const brokenConfigService = {
      getOrThrow: jest.fn(() => {
        throw new Error('JWT_ACCESS_SECRET is required');
      }),
    };

    expect(
      () =>
        new JwtStrategy(
          usersService as unknown as UsersService,
          brokenConfigService as unknown as ConfigService<Env, true>,
          redisService as unknown as RedisService,
        ),
    ).toThrow('JWT_ACCESS_SECRET is required');
  });
});

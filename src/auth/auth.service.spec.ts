import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { RefreshTokenRepository } from './refresh-token.repository';

type TestUser = {
  id: string;
  email: string;
  passwordHash: string;
};

type CreateUserInput = {
  email: string;
  passwordHash: string;
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    create: jest.MockedFunction<(dto: CreateUserInput) => Promise<TestUser>>;
    findByEmail: jest.MockedFunction<
      (email: string) => Promise<TestUser | null>
    >;
    findById: jest.MockedFunction<(id: string) => Promise<TestUser | null>>;
  };
  let jwtService: {
    signAsync: jest.MockedFunction<
      (payload: { sub: string; email: string }) => Promise<string>
    >;
  };
  let refreshTokenRepository: {
    create: jest.MockedFunction<
      (refreshToken: Partial<RefreshToken>) => Promise<RefreshToken>
    >;
    findAllAliveTokensByTime: jest.MockedFunction<
      (date: Date) => Promise<RefreshToken[]>
    >;
    revokeById: jest.MockedFunction<(id: string) => Promise<unknown>>;
  };

  beforeEach(() => {
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
    };
    refreshTokenRepository = {
      create: jest.fn(),
      findAllAliveTokensByTime: jest.fn(),
      revokeById: jest.fn(),
    };

    service = new AuthService(
      jwtService as unknown as JwtService,
      usersService as unknown as UsersService,
      refreshTokenRepository as unknown as RefreshTokenRepository,
    );
  });

  describe('register', () => {
    it('비밀번호를 해시해서 사용자를 생성하고 공개 사용자 정보만 반환한다', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockImplementation((dto) =>
        Promise.resolve({
          id: 'user-1',
          ...dto,
        }),
      );

      const result = await service.register({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        id: 'user-1',
        email: 'user@example.com',
      });

      const createArg = usersService.create.mock.calls[0]?.[0];

      expect(createArg).toBeDefined();
      expect(createArg?.email).toBe('user@example.com');
      expect(createArg?.passwordHash).not.toBe('password123');
      await expect(
        bcrypt.compare('password123', createArg?.passwordHash ?? ''),
      ).resolves.toBe(true);
    });

    it('이미 가입된 이메일이면 ConflictException을 던진다', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: 'hash',
      });

      await expect(
        service.register({
          email: 'user@example.com',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('인증된 사용자 정보로 accessToken과 refreshToken을 발급한다', async () => {
      jwtService.signAsync.mockResolvedValue('access-token');
      refreshTokenRepository.create.mockImplementation((refreshToken) =>
        Promise.resolve({
          id: 'refresh-token-1',
          userId: refreshToken.userId ?? '',
          user: {} as RefreshToken['user'],
          tokenHash: refreshToken.tokenHash ?? '',
          expiresAt: refreshToken.expiresAt ?? new Date(),
          revokedAt: refreshToken.revokedAt ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await service.login({
        id: 'user-1',
        email: 'user@example.com',
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'user@example.com',
      });
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.refreshToken).toHaveLength(128);
    });

    it('refreshToken 원문이 아니라 hash와 만료 시간을 저장한다', async () => {
      jwtService.signAsync.mockResolvedValue('access-token');
      refreshTokenRepository.create.mockImplementation((refreshToken) =>
        Promise.resolve({
          id: 'refresh-token-1',
          userId: refreshToken.userId ?? '',
          user: {} as RefreshToken['user'],
          tokenHash: refreshToken.tokenHash ?? '',
          expiresAt: refreshToken.expiresAt ?? new Date(),
          revokedAt: refreshToken.revokedAt ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await service.login({
        id: 'user-1',
        email: 'user@example.com',
      });
      const returnedRefreshToken = result.refreshToken;
      const createArg = refreshTokenRepository.create.mock.calls[0]?.[0];

      expect(createArg).toBeDefined();
      expect(createArg?.userId).toBe('user-1');
      expect(createArg?.revokedAt).toBeNull();
      expect(createArg?.expiresAt).toBeInstanceOf(Date);
      expect(createArg?.tokenHash).not.toBe(returnedRefreshToken);
      await expect(
        bcrypt.compare(returnedRefreshToken, createArg?.tokenHash ?? ''),
      ).resolves.toBe(true);
    });
  });

  describe('refreshAccessToken', () => {
    it('유효한 refreshToken이면 기존 토큰을 폐기하고 새 토큰들을 발급한다', async () => {
      const refreshToken = 'refresh-token';
      const tokenHash = await bcrypt.hash(refreshToken, 10);

      refreshTokenRepository.findAllAliveTokensByTime.mockResolvedValue([
        createRefreshTokenFixture({
          userId: 'user-1',
          tokenHash,
        }),
      ]);
      usersService.findById.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: 'hashed-password',
      });
      jwtService.signAsync.mockResolvedValue('new-access-token');
      refreshTokenRepository.revokeById.mockResolvedValue(undefined);
      refreshTokenRepository.create.mockImplementation((refreshTokenEntity) =>
        Promise.resolve({
          id: 'refresh-token-2',
          userId: refreshTokenEntity.userId ?? '',
          user: {} as RefreshToken['user'],
          tokenHash: refreshTokenEntity.tokenHash ?? '',
          expiresAt: refreshTokenEntity.expiresAt ?? new Date(),
          revokedAt: refreshTokenEntity.revokedAt ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await service.refreshAccessToken({ refreshToken });
      const createArg = refreshTokenRepository.create.mock.calls[0]?.[0];

      expect(
        refreshTokenRepository.findAllAliveTokensByTime,
      ).toHaveBeenCalledWith(expect.any(Date));
      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'user@example.com',
      });
      expect(refreshTokenRepository.revokeById).toHaveBeenCalledWith(
        'refresh-token-1',
      );
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.refreshToken).toHaveLength(128);
      expect(result.refreshToken).not.toBe(refreshToken);

      expect(createArg).toBeDefined();
      expect(createArg?.userId).toBe('user-1');
      expect(createArg?.revokedAt).toBeNull();
      expect(createArg?.expiresAt).toBeInstanceOf(Date);
      expect(createArg?.tokenHash).not.toBe(result.refreshToken);
      await expect(
        bcrypt.compare(result.refreshToken, createArg?.tokenHash ?? ''),
      ).resolves.toBe(true);
    });

    it('일치하는 refreshToken이 없으면 UnauthorizedException을 던진다', async () => {
      const tokenHash = await bcrypt.hash('different-refresh-token', 10);

      refreshTokenRepository.findAllAliveTokensByTime.mockResolvedValue([
        createRefreshTokenFixture({
          userId: 'user-1',
          tokenHash,
        }),
      ]);

      await expect(
        service.refreshAccessToken({ refreshToken: 'refresh-token' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(usersService.findById).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(refreshTokenRepository.revokeById).not.toHaveBeenCalled();
      expect(refreshTokenRepository.create).not.toHaveBeenCalled();
    });

    it('refreshToken의 사용자가 없으면 UnauthorizedException을 던진다', async () => {
      const refreshToken = 'refresh-token';
      const tokenHash = await bcrypt.hash(refreshToken, 10);

      refreshTokenRepository.findAllAliveTokensByTime.mockResolvedValue([
        createRefreshTokenFixture({
          userId: 'missing-user',
          tokenHash,
        }),
      ]);
      usersService.findById.mockResolvedValue(null);

      await expect(
        service.refreshAccessToken({ refreshToken }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(refreshTokenRepository.revokeById).not.toHaveBeenCalled();
      expect(refreshTokenRepository.create).not.toHaveBeenCalled();
    });
  });
});

function createRefreshTokenFixture(
  overrides: Partial<RefreshToken> = {},
): RefreshToken {
  return {
    id: 'refresh-token-1',
    userId: 'user-1',
    user: {} as RefreshToken['user'],
    tokenHash: 'hashed-refresh-token',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    revokedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

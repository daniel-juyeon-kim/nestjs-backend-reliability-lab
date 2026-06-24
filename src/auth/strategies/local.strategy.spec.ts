import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth.service';
import { LocalStrategy } from './local.strategy';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: {
    validateUser: jest.MockedFunction<
      (
        email: string,
        password: string,
        ip: string | undefined,
      ) => Promise<{ id: string; email: string }>
    >;
  };
  const request = { ip: '127.0.0.1' } as Request;

  beforeEach(() => {
    authService = {
      validateUser: jest.fn(),
    };

    strategy = new LocalStrategy(authService as unknown as AuthService);
  });

  it('이메일과 비밀번호가 맞으면 인증된 사용자 정보를 반환한다', async () => {
    authService.validateUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    });

    const result = await strategy.validate(
      request,
      'user@example.com',
      'password123',
    );

    expect(authService.validateUser).toHaveBeenCalledWith(
      'user@example.com',
      'password123',
      '127.0.0.1',
    );
    expect(result).toEqual({
      id: 'user-1',
      email: 'user@example.com',
    });
  });

  it('사용자가 없으면 UnauthorizedException을 던진다', async () => {
    authService.validateUser.mockRejectedValue(new UnauthorizedException());

    await expect(
      strategy.validate(request, 'missing@example.com', 'password123'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('비밀번호가 틀리면 UnauthorizedException을 던진다', async () => {
    authService.validateUser.mockRejectedValue(new UnauthorizedException());

    await expect(
      strategy.validate(request, 'user@example.com', 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

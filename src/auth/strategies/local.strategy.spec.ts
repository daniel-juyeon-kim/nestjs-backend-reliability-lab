import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { LocalStrategy } from './local.strategy';

type TestUser = {
  id: string;
  email: string;
  passwordHash: string;
};

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let usersService: {
    findByEmail: jest.MockedFunction<
      (email: string) => Promise<TestUser | null>
    >;
  };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
    };

    strategy = new LocalStrategy(usersService as unknown as UsersService);
  });

  it('이메일과 비밀번호가 맞으면 인증된 사용자 정보를 반환한다', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash,
    });

    const result = await strategy.validate('user@example.com', 'password123');

    expect(usersService.findByEmail).toHaveBeenCalledWith('user@example.com');
    expect(result).toEqual({
      id: 'user-1',
      email: 'user@example.com',
    });
  });

  it('사용자가 없으면 UnauthorizedException을 던진다', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      strategy.validate('missing@example.com', 'password123'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('비밀번호가 틀리면 UnauthorizedException을 던진다', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash,
    });

    await expect(
      strategy.validate('user@example.com', 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

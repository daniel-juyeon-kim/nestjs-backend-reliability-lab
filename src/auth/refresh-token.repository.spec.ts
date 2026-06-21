import { IsNull, MoreThan, Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { RefreshTokenRepository } from './refresh-token.repository';

describe('RefreshTokenRepository', () => {
  let repository: {
    find: jest.MockedFunction<
      (options: {
        where: {
          userId?: string;
          expiresAt: ReturnType<typeof MoreThan>;
          revokedAt?: ReturnType<typeof IsNull>;
        };
      }) => Promise<RefreshToken[]>
    >;
  };
  let refreshTokenRepository: RefreshTokenRepository;

  beforeEach(() => {
    repository = {
      find: jest.fn().mockResolvedValue([]),
    };
    refreshTokenRepository = new RefreshTokenRepository(
      repository as unknown as Repository<RefreshToken>,
    );
  });

  it('refresh 대상에서 만료된 토큰을 제외한다', async () => {
    const now = new Date('2026-06-21T12:00:00.000Z');

    await refreshTokenRepository.findAllTokensByTime(now);

    expect(repository.find).toHaveBeenCalledWith({
      where: {
        expiresAt: MoreThan(now),
      },
    });
  });

  it('logout 대상에서 만료되거나 폐기된 토큰을 제외한다', async () => {
    const now = new Date('2026-06-21T12:00:00.000Z');

    await refreshTokenRepository.findAllAliveTokensByTime(now);

    expect(repository.find).toHaveBeenCalledWith({
      where: {
        expiresAt: MoreThan(now),
        revokedAt: IsNull(),
      },
    });
  });

  it('session 목록에서 현재 사용자의 active token만 조회한다', async () => {
    const now = new Date('2026-06-21T12:00:00.000Z');

    await refreshTokenRepository.findActiveByUserId('user-1', now);

    expect(repository.find).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        expiresAt: MoreThan(now),
        revokedAt: IsNull(),
      },
    });
  });
});

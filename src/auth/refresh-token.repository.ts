import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';

export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  create(refreshToken: Partial<RefreshToken>) {
    return this.refreshTokenRepository.save(refreshToken);
  }

  findAllTokensByTime(date: Date) {
    return this.refreshTokenRepository.find({
      where: {
        expiresAt: MoreThan(date),
      },
    });
  }

  findAllAliveTokensByTime(date: Date) {
    return this.refreshTokenRepository.find({
      where: {
        expiresAt: MoreThan(date),
        revokedAt: IsNull(),
      },
    });
  }

  findActiveByUserId(userId: string, date: Date) {
    return this.refreshTokenRepository.find({
      where: {
        userId,
        expiresAt: MoreThan(date),
        revokedAt: IsNull(),
      },
    });
  }

  revokeActiveById(id: string, userId: string, now: Date) {
    return this.refreshTokenRepository.update(
      {
        id,
        userId,
        revokedAt: IsNull(),
        expiresAt: MoreThan(now),
      },
      { revokedAt: now },
    );
  }

  updateRevokedAtByUserId(userId: string) {
    return this.refreshTokenRepository.update(
      { userId: userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}

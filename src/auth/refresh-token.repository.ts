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

  findAllAliveTokensByTime(date: Date) {
    return this.refreshTokenRepository.find({
      where: {
        expiresAt: MoreThan(date),
        revokedAt: IsNull(),
      },
    });
  }
}

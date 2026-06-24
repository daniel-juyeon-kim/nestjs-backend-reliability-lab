import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ClaimCouponDto } from './dto/claim-coupon.dto';
import { CouponClaim } from './entities/coupon-claim.entity';
import { Coupon } from './entities/coupon.entity';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponsRepository: Repository<Coupon>,
  ) {}

  async claim(couponId: string, dto: ClaimCouponDto) {
    return this.couponsRepository.manager.transaction(async (tx) => {
      const coupon = await tx.findOne(Coupon, {
        where: { id: couponId },
        lock: { mode: 'pessimistic_write' },
      });

      if (coupon === null) {
        throw new NotFoundException('쿠폰을 찾을 수 없습니다.');
      }

      if (coupon.remaining <= 0) {
        throw new ConflictException('남은 쿠폰이 없습니다.');
      }

      await tx.save(Coupon, {
        ...coupon,
        remaining: coupon.remaining - 1,
      });

      const claim = await this.saveClaim(tx, couponId, dto.userId);

      return { id: claim.id, couponId, userId: dto.userId };
    });
  }

  private async saveClaim(
    transactionManager: EntityManager,
    couponId: string,
    userId: string,
  ) {
    try {
      return await transactionManager.save(CouponClaim, { couponId, userId });
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException('이미 발급받은 쿠폰입니다.');
      }

      throw error;
    }
  }
}

function isDuplicateEntryError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errno' in error &&
    error.errno === 1062
  );
}

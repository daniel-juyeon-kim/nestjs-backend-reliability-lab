import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClaimCouponDto } from './dto/claim-coupon.dto';
import { CouponClaim } from './entities/coupon-claim.entity';
import { Coupon } from './entities/coupon.entity';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponsRepository: Repository<Coupon>,
    @InjectRepository(CouponClaim)
    private readonly claimsRepository: Repository<CouponClaim>,
  ) {}

  async claim(couponId: string, dto: ClaimCouponDto) {
    const coupon = await this.couponsRepository.findOneBy({ id: couponId });

    if (coupon === null) {
      throw new NotFoundException('쿠폰을 찾을 수 없습니다.');
    }

    if (coupon.remaining <= 0) {
      throw new ConflictException('남은 쿠폰이 없습니다.');
    }

    // ponytail: deliberately naive so Track 3 can reproduce lost updates.
    await delay(20);

    await this.couponsRepository.save({
      ...coupon,
      remaining: coupon.remaining - 1,
    });
    const claim = await this.claimsRepository.save({
      couponId,
      userId: dto.userId,
    });

    return { id: claim.id, couponId, userId: dto.userId };
  }
}

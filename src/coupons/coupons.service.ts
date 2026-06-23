import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { ClaimCouponDto } from './dto/claim-coupon.dto';
import { CouponClaim } from './entities/coupon-claim.entity';
import { Coupon } from './entities/coupon.entity';

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

    const result = await this.couponsRepository.update(
      { id: coupon.id, remaining: MoreThan(0) },
      {
        remaining: () => 'remaining - 1',
      },
    );

    if (result.affected === 0) {
      throw new ConflictException('남은 쿠폰이 없습니다.');
    }

    const claim = await this.claimsRepository.save({
      couponId,
      userId: dto.userId,
    });

    return { id: claim.id, couponId, userId: dto.userId };
  }
}

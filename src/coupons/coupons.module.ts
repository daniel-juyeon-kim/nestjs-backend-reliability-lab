import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { CouponClaim } from './entities/coupon-claim.entity';
import { Coupon } from './entities/coupon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, CouponClaim])],
  controllers: [CouponsController],
  providers: [CouponsService],
})
export class CouponsModule {}

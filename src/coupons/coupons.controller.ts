import { Body, Controller, Param, Post } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { ClaimCouponDto } from './dto/claim-coupon.dto';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post(':couponId/claims')
  claim(@Param('couponId') couponId: string, @Body() dto: ClaimCouponDto) {
    return this.couponsService.claim(couponId, dto);
  }
}

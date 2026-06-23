import { IsUUID } from 'class-validator';

export class ClaimCouponDto {
  @IsUUID()
  userId!: string;
}

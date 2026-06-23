import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity({ name: 'coupon_claims' })
@Unique(['userId', 'couponId'])
export class CouponClaim {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @Column({ type: 'varchar', length: 36 })
  couponId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}

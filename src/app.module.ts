import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { RootConfigModule } from './config/config.module';
import { CouponsModule } from './coupons/coupons.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    CouponsModule,
    HealthModule,
    RootConfigModule,
  ],
})
export class AppModule {}

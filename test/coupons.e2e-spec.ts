import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { CouponClaim } from '../src/coupons/entities/coupon-claim.entity';
import { Coupon } from '../src/coupons/entities/coupon.entity';

function assertE2eDatabase() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('e2e 테스트는 NODE_ENV=test에서만 실행해야 합니다.');
  }

  if (process.env.DB_NAME !== 'learn_auth_test') {
    throw new Error('e2e 테스트는 learn_auth_test DB에서만 실행해야 합니다.');
  }
}

describe('Coupons e2e', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let httpServer: App;

  beforeAll(async () => {
    assertE2eDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );

    await app.init();

    httpServer = app.getHttpServer() as App;
    dataSource = app.get(DataSource);
    await dataSource.synchronize();
  });

  beforeEach(async () => {
    await dataSource
      .createQueryBuilder()
      .delete()
      .from('coupon_claims')
      .execute();
    await dataSource.createQueryBuilder().delete().from('coupons').execute();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('동시에 claim해도 쿠폰 수량만큼만 성공하고 remaining은 0이 된다', async () => {
    const coupon = await dataSource.getRepository(Coupon).save({
      name: 'limited coupon',
      remaining: 10,
    });

    const responses = await Promise.all(
      Array.from({ length: 50 }, () =>
        request(httpServer)
          .post(`/coupons/${coupon.id}/claims`)
          .send({ userId: randomUUID() }),
      ),
    );
    const successCount = responses.filter(
      ({ status }) => status === 201,
    ).length;
    const conflictCount = responses.filter(
      ({ status }) => status === 409,
    ).length;
    const claimCount = await dataSource.getRepository(CouponClaim).count();
    const updatedCoupon = await dataSource
      .getRepository(Coupon)
      .findOneByOrFail({ id: coupon.id });

    expect(successCount).toBe(10);
    expect(conflictCount).toBe(40);
    expect(claimCount).toBe(10);
    expect(updatedCoupon.remaining).toBe(0);
  });
});

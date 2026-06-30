import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { IdempotencyKey } from '../src/transfers/entities/idempotency-key.entity';
import { Transfer } from '../src/transfers/entities/transfer.entity';

type AuthResponse = {
  accessToken: string;
};

type RegisterResponse = {
  id: string;
};

type TransferResponse = {
  id: string;
  senderId: string;
  receiverId: string;
  amount: number;
  status: string;
};

function assertE2eDatabase() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('e2e 테스트는 NODE_ENV=test에서만 실행해야 합니다.');
  }

  if (process.env.DB_NAME !== 'learn_auth_test') {
    throw new Error('e2e 테스트는 learn_auth_test DB에서만 실행해야 합니다.');
  }
}

describe('Transfers e2e', () => {
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
      .from('idempotency_keys')
      .execute();
    await dataSource.createQueryBuilder().delete().from('transfers').execute();
    await dataSource
      .createQueryBuilder()
      .delete()
      .from('refresh_tokens')
      .execute();
    await dataSource.createQueryBuilder().delete().from('users').execute();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('같은 Idempotency-Key 요청이 동시에 들어와도 송금 요청은 한 번만 생성된다', async () => {
    const sender = await registerAndLogin(
      'transfer-sender@example.com',
      'password123',
    );
    const receiver = await registerAndLogin(
      'transfer-receiver@example.com',
      'password123',
    );
    const idempotencyKey = 'same-transfer-key';

    const responses = await Promise.all([
      request(httpServer)
        .post('/transfers')
        .set('Authorization', `Bearer ${sender.accessToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({ receiverId: receiver.id, amount: 1000 }),
      request(httpServer)
        .post('/transfers')
        .set('Authorization', `Bearer ${sender.accessToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({ receiverId: receiver.id, amount: 1000 }),
    ]);
    const bodies = responses.map(
      (response) => response.body as TransferResponse,
    );
    const transferCount = await dataSource.getRepository(Transfer).count();
    const idempotencyCount = await dataSource
      .getRepository(IdempotencyKey)
      .count();

    expect(responses.map(({ status }) => status).sort()).toEqual([201, 201]);
    expect(bodies[0]).toEqual(bodies[1]);
    expect(transferCount).toBe(1);
    expect(idempotencyCount).toBe(1);
  });

  async function registerAndLogin(email: string, password: string) {
    const registerResponse = await request(httpServer)
      .post('/auth/register')
      .send({ email, password })
      .expect(201);
    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    return {
      ...(registerResponse.body as RegisterResponse),
      ...(loginResponse.body as AuthResponse),
    };
  }
});

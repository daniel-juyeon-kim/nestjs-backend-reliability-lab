import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

type RegisterResponse = {
  id: string;
  email: string;
  passwordHash?: string;
};

type CurrentUserResponse = {
  id: string;
  email: string;
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

function assertE2eDatabase() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('e2e 테스트는 NODE_ENV=test에서만 실행해야 합니다.');
  }

  if (process.env.DB_NAME !== 'learn_auth_test') {
    throw new Error('e2e 테스트는 learn_auth_test DB에서만 실행해야 합니다.');
  }
}

describe('Auth e2e', () => {
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
      .from('refresh_tokens')
      .execute();
    await dataSource.createQueryBuilder().delete().from('users').execute();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('회원가입 후 로그인하고 Bearer 토큰으로 현재 사용자를 조회한다', async () => {
    const email = 'e2e-user@example.com';
    const password = 'password123';

    const registerResponse = await request(httpServer)
      .post('/auth/register')
      .send({ email, password })
      .expect(201);
    const registerBody = registerResponse.body as RegisterResponse;

    expect(registerBody).toMatchObject({ email });
    expect(registerBody.id).toEqual(expect.any(String));
    expect(registerBody.passwordHash).toBeUndefined();

    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const { accessToken } = loginResponse.body as LoginResponse;

    expect(accessToken).toEqual(expect.any(String));

    await request(httpServer)
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        const currentUser = body as CurrentUserResponse;

        expect(currentUser).toEqual({
          id: registerBody.id,
          email,
        });
      });
  });

  it('Bearer 토큰이 없으면 현재 사용자 조회를 거부한다', async () => {
    await request(httpServer).get('/auth/me').expect(401);
  });

  it('로그아웃 후 같은 refreshToken으로 accessToken을 재발급할 수 없다', async () => {
    const email = 'logout-user@example.com';
    const password = 'password123';

    await request(httpServer)
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .send({ email, password })
      .expect(201);
    const { refreshToken } = loginResponse.body as LoginResponse;

    expect(refreshToken).toEqual(expect.any(String));

    await request(httpServer)
      .post('/auth/logout')
      .send({ refreshToken })
      .expect(201);

    await request(httpServer)
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });
});

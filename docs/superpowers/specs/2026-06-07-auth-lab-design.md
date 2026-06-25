# NestJS 백엔드 학습 랩 설계서

## 목표

이 프로젝트는 NestJS 백엔드를 직접 구현하면서 인증, JWT/세션, API key, Redis, DB 동시성, 메시지큐, OAuth/OIDC 같은 핵심 백엔드 주제를 단계별로 학습하기 위한 실습 프로젝트다.

완성된 서버를 한 번에 제공하는 것이 목적이 아니다. 프로젝트는 실행 가능한 NestJS 백엔드를 점진적으로 만들고, 각 백엔드 개념을 작은 단위로 구현한 뒤 테스트와 코드 리뷰로 검증한다. 인증은 첫 번째 큰 축이지만, Redis, DB 동시성, 메시지큐, OAuth/OIDC도 독립 학습 축으로 다룬다. 학습자는 핵심 로직을 직접 작성하고, 에이전트는 구현 후 코드 리뷰, 테스트 보강, 인프라 정리를 지원한다.

## 학습 원칙

- 코드는 학습자가 직접 작성한다.
- 에이전트는 먼저 완성 구현을 제공하지 않는다.
- 과제는 작게 나누고, 각 과제는 테스트와 리뷰를 통과해야 완료된다.
- 막혔을 때는 정답 코드보다 힌트, 설계 방향, 디버깅 순서를 먼저 제공한다.
- 인증 보안, 인증 방식 간 trade-off, 데이터 모델, 트랜잭션, Redis TTL, 큐 재시도처럼 실제 백엔드에서 중요한 지점을 우선한다.
- 각 트랙은 실패 케이스 재현, 구현, 보안 또는 장애 검증, trade-off 문서화를 포함해야 완료된다.

## 기술 스택

- 런타임: Node.js
- 프레임워크: NestJS
- 인증 프레임워크: Passport
- 인증 방식: Local strategy, JWT strategy, session guard, API key guard, OAuth/OIDC login
- 데이터베이스: MySQL
- ORM: TypeORM
- 로컬 인프라: Docker Compose
- 컨테이너 실행 환경: OrbStack
- 캐시 및 큐 백엔드: Redis
- 메시지큐: BullMQ
- 테스트: Jest 기반 unit test, e2e test
- 패키지 매니저: npm

## 현재 구현 상태

현재 프로젝트는 초기 스켈레톤 단계를 지나 Local Auth, JWT Access Token, e2e 테스트 기반까지 구현했다.

- NestJS 애플리케이션 기본 구조
- `compose.yml` 기반 MySQL, Redis 실행 환경
- TypeORM MySQL 연결 설정
- 환경변수 로딩 및 검증
- `HealthModule`
- `UsersModule`
- `AuthModule`
- Passport local strategy
- Passport JWT strategy
- JWT guard
- 회원가입 API
- 로그인 API
- 현재 사용자 조회 API
- JWT 설정의 `@nestjs/config` 분리
- MySQL 기반 e2e 테스트 환경
- e2e 테스트 전용 DB `learn_auth_test`
- Refresh Token 저장용 `refresh_tokens` 테이블
- Refresh Token rotation 기본 흐름
- `.env.example`

아직 구현하지 않는다:

- 완성된 Redis rate limit
- 수량 제한 쿠폰 도메인의 완성된 동시성 제어 코드
- 완성된 BullMQ worker

## 학습 트랙

현재 커리큘럼은 다음 순서로 진행한다.

1. Auth baseline
2. Refresh Session Security
3. DB Concurrency
4. Redis State and Rate Limit
5. API Key
6. OAuth/OIDC
7. BullMQ
8. Ops Security and Observability

인증 도메인은 앞부분의 학습 소재로 사용한다. Redis, DB 동시성, 메시지큐는 인증을 보조하는 기능이 아니라 별도의 백엔드 역량으로 검증한다.

## 프로젝트 구조 초안

현재 구조는 다음 형태를 기준으로 한다.

```text
src/
  app.module.ts
  main.ts
  config/
    env.schema.ts
    config.module.ts
    database.config.ts
  health/
    health.controller.ts
    health.module.ts
  users/
    entities/user.entity.ts
    dto/create-user.dto.ts
    users.module.ts
    users.service.ts
  auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    dto/register.dto.ts
    dto/login.dto.ts
    dto/jwt.payload.dto.ts
    entities/refresh-token.entity.ts
    refresh-token.repository.ts
    strategies/local.strategy.ts
    strategies/jwt.strategy.ts
    guards/local-auth.guard.ts
    guards/jwt-auth.guard.ts
test/
  auth.e2e-spec.ts
```

이 구조는 구현 중 더 작게 나눌 수 있다. 단, 과제의 핵심을 흐리지 않는 범위에서만 분리한다.

## 학습 루프

각 과제는 다음 순서로 진행한다.

1. 에이전트가 과제 문서를 작성한다.
2. 과제 문서에는 목표, API 명세, 구현 제한, 테스트 기준, 제출 기준을 적는다.
3. 학습자가 직접 구현한다.
4. 학습자가 리뷰를 요청한다.
5. 에이전트는 코드 리뷰 관점으로 버그, 보안 문제, 설계 문제, 누락 테스트를 지적한다.
6. 학습자가 수정한다.
7. lint, typecheck, unit test, e2e test를 통과하면 다음 과제로 넘어간다.

기본 피드백 방식은 페어 프로그래밍이 아니라 코드 리뷰다.

## Track 1: Auth baseline

### 목표

가장 기본적인 인증 흐름을 직접 구현한다.

학습자는 사용자를 생성하고, 비밀번호를 안전하게 저장하고, Passport local strategy로 로그인하고, JWT access token으로 보호 라우트에 접근하는 흐름을 만든다.

### 구현할 기능

- [x] 회원가입 서비스 레이어
- [x] 이메일 중복 검사
- [x] 비밀번호 해싱
- [x] 로그인 서비스 레이어
- [x] Passport local strategy
- [x] JWT access token 발급
- [x] Passport JWT strategy
- [x] JWT guard
- [x] 현재 로그인한 사용자 조회 API
- [x] MySQL 기반 auth e2e test
- [x] e2e 테스트 DB 격리
- [x] JWT secret 설정 분리

### 예상 API

```text
POST /auth/register
POST /auth/login
GET /auth/me
```

`POST /auth/register`는 이메일과 비밀번호를 받아 사용자를 생성한다.

진행 상태: `AuthService.register()` 기준 회원가입 서비스 레이어 구현과 빌드 검증을 완료했다.

`POST /auth/login`은 이메일과 비밀번호를 검증하고 access token을 반환한다.

진행 상태: `AuthService.login()` 기준 로그인 서비스 레이어 구현과 빌드 검증을 완료했다.

`GET /auth/me`는 JWT access token이 있을 때만 현재 사용자 정보를 반환한다.

### 데이터 모델

`users` 테이블은 최소한 다음 필드를 가진다.

- `id`
- `email`
- `passwordHash`
- `createdAt`
- `updatedAt`

이메일은 유니크해야 한다. API 응답에 `passwordHash`가 포함되면 안 된다.

### 직접 구현해야 하는 부분

- DTO validation
- password hash 생성
- password 검증
- 이메일 중복 처리
- local strategy의 credential validation
- JWT payload 설계
- JWT strategy의 payload validation
- guard 적용
- auth e2e test

### 검증 기준

- 같은 이메일로 두 번 가입할 수 없다.
- 비밀번호는 평문으로 저장되지 않는다.
- 로그인 실패 시 사용자가 존재하는지 여부를 노출하지 않는다.
- 잘못된 비밀번호는 `401 Unauthorized`를 반환한다.
- 토큰 없이 `/auth/me`에 접근하면 실패한다.
- 유효한 토큰으로 `/auth/me`에 접근하면 사용자 정보를 받는다.
- 응답에는 `passwordHash`가 없다.

### 이 과제에서 다루지 않는 것

- refresh token
- Redis
- 로그아웃
- 세션 관리
- OAuth

## Track 1.5: 인증 방식 비교

### 목표

여러 인증 방식을 직접 구현하거나 작은 실험으로 비교한다.

JWT access token 방식만 알면 인증을 단순히 "토큰을 발급하고 검사하는 것"으로 이해하기 쉽다. 이 과제에서는 stateless 인증, stateful session 인증, hybrid 인증, API key 인증의 차이를 분리해서 경험한다.

### 비교할 인증 방식

#### Stateless JWT

서버가 로그인 상태를 DB나 Redis에서 매번 조회하지 않고, access token 자체의 서명과 만료 시간으로 인증한다.

학습 포인트:

- 서버 저장소 조회 없이 인증 가능
- access token 탈취 시 즉시 폐기가 어렵다
- token payload 설계를 신중히 해야 한다
- 권한 변경이 즉시 반영되지 않을 수 있다

#### Stateful Session

서버가 세션 저장소에 로그인 상태를 보관하고, 클라이언트는 session id를 전달한다. 이 방식은 cookie 기반 session과 함께 비교한다.

학습 포인트:

- 서버에서 세션을 즉시 폐기할 수 있다
- 매 요청마다 세션 저장소 조회가 필요하다
- 브라우저 기반 앱에서는 cookie 보안 설정이 중요하다
- CSRF 방어를 함께 고려해야 한다

#### Hybrid Access Token + Refresh Session

짧은 access token은 JWT로 처리하고, 긴 로그인 상태는 서버 세션과 refresh token으로 관리한다.

학습 포인트:

- API 요청은 빠르게 처리하고, 장기 세션은 서버에서 제어한다
- refresh token rotation이 필요하다
- 동시 refresh 요청 문제가 발생할 수 있다
- 구현 복잡도가 stateless JWT보다 높다

#### API Key

사용자 로그인보다는 서버 간 통신, 외부 개발자 API, 내부 자동화에 자주 쓰는 방식이다.

학습 포인트:

- 사용자 세션과 API client 인증은 다르다
- key prefix, hash 저장, 마지막 사용 시각 기록이 필요하다
- key rotation과 revoke가 중요하다
- rate limit과 함께 쓰이는 경우가 많다

### 예상 실습

- 같은 보호 API를 JWT guard로 보호해 보기
- 같은 보호 API를 session guard로 보호해 보기
- API key 전용 endpoint를 만들어 보기
- 각 방식의 logout 또는 revoke 동작 비교하기
- 각 방식에서 탈취된 credential을 폐기하는 방법 비교하기

### 직접 구현해야 하는 부분

- session id 기반 guard
- cookie 기반 session 전달 방식
- API key entity 또는 테이블 설계
- API key hash 저장
- API key guard
- 인증 방식별 보호 route
- 인증 방식별 실패 테스트

### 검증 기준

- JWT 방식은 access token만으로 보호 API에 접근할 수 있다.
- session 방식은 서버 저장소의 세션이 폐기되면 즉시 접근이 막힌다.
- API key는 평문 저장되지 않는다.
- 폐기된 API key는 사용할 수 없다.
- 각 방식의 장단점을 `docs/assignments/` 문서에 짧게 정리한다.

### 이 과제에서 다루지 않는 것

- OAuth authorization code flow
- SAML
- WebAuthn
- 운영용 multi-factor authentication

## Track 2: Refresh Session Security

### 목표

JWT만 사용하는 인증과 서버 세션을 함께 사용하는 인증의 차이를 익힌다.

Access token은 짧게 유지하고, refresh token은 서버 세션과 연결한다. Refresh token은 평문 저장하지 않고 해시해서 저장한다.

이 트랙은 Track 1의 stateless JWT 방식과 Track 1.5의 stateful session 방식을 바탕으로 hybrid 인증 방식을 구현하는 단계다.

### 구현할 기능

- [x] refresh token 저장 테이블 생성
- [x] 로그인 시 access token과 refresh token 발급
- [x] refresh token 해시 저장
- [x] refresh token으로 access token 재발급
- [x] refresh token rotation
- [x] 로그아웃
- [x] refresh token 만료 처리
- [x] refresh token 폐기
- [x] refresh token 재사용 감지
- [x] 활성 세션 목록 조회
- [x] 특정 세션 폐기 API
- [x] 동시 refresh 요청 단일 성공 처리

### 예상 API

```text
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET /auth/sessions
DELETE /auth/sessions/:sessionId
```

`POST /auth/refresh`는 refresh token을 받아 유효한 active token hash와 비교한 뒤 새 access token과 새 refresh token을 발급한다.

현재 단계에서는 refresh token rotation을 적용한다. refresh 요청이 성공하면 기존 refresh token은 `revokedAt`으로 폐기하고, 새 refresh token의 hash를 DB에 저장한 뒤 새 access token과 함께 반환한다. 이미 폐기된 refresh token이 다시 사용되면 재사용 시도로 보고 해당 사용자의 active refresh token을 모두 폐기한다.

같은 refresh token으로 동시에 재발급 요청이 들어오면 하나만 성공해야 한다. 현재 구현은 `id`, `userId`, `revokedAt IS NULL`, `expiresAt > now` 조건부 update로 refresh token 사용권을 선점하고, affected row가 1이 아니면 `401 Unauthorized`로 실패시킨다.

`POST /auth/logout`은 refresh token을 받아 현재 refresh session을 폐기한다. 로그아웃 후 같은 refresh token으로 access token을 재발급할 수 없어야 한다.

현재 구현은 `refresh_tokens` 테이블과 `revokedAt`으로 refresh token을 폐기한다. 로그아웃은 전달받은 active refresh token 하나만 폐기하고, 폐기된 refresh token 재사용은 해당 사용자의 active refresh token을 모두 폐기한다.

만료 처리는 `expiresAt` 기준으로 한다. refresh와 logout 대상 토큰 조회는 `expiresAt`이 현재 시각보다 큰 토큰만 포함한다.

`GET /auth/sessions`는 현재 사용자의 활성 세션 목록을 반환한다. JWT access token이 있어야 접근할 수 있고, 현재 사용자의 `revokedAt IS NULL`, `expiresAt > now` refresh token만 반환한다. 응답에는 `tokenHash`를 포함하지 않고 `id`, `createdAt`, `expiresAt`만 포함한다.

`DELETE /auth/sessions/:sessionId`는 특정 세션을 폐기한다. JWT access token이 있어야 접근할 수 있고, 현재 사용자의 active session만 폐기한다. 존재하지 않거나 다른 사용자의 session이거나 이미 만료/폐기된 session이면 `404 Not Found`를 반환한다.

### 데이터 모델

현재 단계에서는 `refresh_tokens` 테이블을 먼저 사용한다.

- `id`
- `userId`
- `tokenHash`
- `expiresAt`
- `revokedAt`
- `createdAt`
- `updatedAt`

`tokenHash`는 평문 refresh token을 저장하면 안 된다.

나중에 여러 기기 세션, 사용자 agent, IP, 세션 목록 API를 다룰 때 `auth_sessions` 모델로 확장할 수 있다.

### 직접 구현해야 하는 부분

- [x] refresh token 재발급 API
- [x] refresh token 검증
- [x] refresh token rotation
- [x] 로그아웃 API
- [x] 재사용 감지 정책 결정
- [x] 폐기된 refresh token 처리
- [x] 만료된 refresh token 처리
- [x] 활성 세션 목록 조회
- [x] 특정 세션 폐기
- [x] 동시 refresh 요청 단일 성공 처리

### 검증 기준

- 로그인할 때마다 새 refresh token이 생성된다.
- refresh token은 DB에 평문으로 저장되지 않는다.
- refresh 요청이 성공하면 새 access token을 받을 수 있다.
- refresh 요청이 성공하면 기존 refresh token은 더 이상 사용할 수 없다.
- refresh 요청이 성공하면 새 refresh token을 받을 수 있다.
- 로그아웃 후 같은 refresh token으로 재발급할 수 없다.
- 만료된 refresh token은 refresh에 실패한다.
- 폐기된 refresh token은 refresh에 실패한다.
- 폐기된 refresh token이 재사용되면 해당 사용자의 active refresh token을 모두 폐기한다.
- API 응답에는 민감한 token hash가 포함되지 않는다.
- 현재 사용자는 active refresh session 목록을 조회할 수 있다.
- session 목록 응답에는 `tokenHash`가 포함되지 않는다.
- 현재 사용자는 본인의 active refresh session을 폐기할 수 있다.
- 존재하지 않거나 소유하지 않은 session 폐기는 `404 Not Found`를 반환한다.
- 같은 refresh token으로 동시에 재발급 요청을 보내면 하나만 성공한다.
- refresh token 사용권 선점에 실패한 요청은 새 access token과 refresh token을 발급받지 못한다.

## Track 3: DB Concurrency

### 목표

동시에 들어오는 요청이 DB 상태를 꼬이게 만드는 상황을 재현하고 해결한다.

Refresh token rotation은 이미 인증 트랙에서 다룬 동시성 예제다. 이 트랙에서는 수량 제한 쿠폰을 별도 도메인으로 만들고, 여러 요청이 동시에 같은 자원을 차감할 때 DB 상태가 깨지지 않게 만든다.

Track 3는 이 커리큘럼에서 가장 깊게 다룬다. 단, 범위를 넓히지 않는다. 쿠폰, 포인트, 재고를 모두 만들지 않고 하나의 제한 자원 도메인에서 race condition 재현, 데이터 불변식 보존, lock 선택, idempotency를 검증한다.

### 실습 후보

1. [x] 동시에 같은 refresh token으로 재발급 요청을 보냈을 때 하나만 성공하게 만들기
2. [x] refresh token 재사용을 감지하고 세션을 폐기하기
3. [ ] 수량 제한 쿠폰으로 초과 발급 문제 해결하기
4. [ ] 같은 사용자의 중복 쿠폰 claim 방지하기
5. [ ] idempotency key로 요청 재시도 안전하게 처리하기

### 권장 도메인

수량 제한 쿠폰을 사용한다.

- `coupons.remaining`: lost update와 초과 발급을 재현한다.
- `coupon_claims`: 사용자별 중복 claim을 막는다.
- `idempotency_keys`: 같은 요청 재시도 시 side effect가 한 번만 발생하게 한다.

포인트는 ledger와 정산 개념이 섞여 범위가 커지고, 재고는 불변식이 선명하지만 중복 지급 unique constraint 학습이 약하다. 쿠폰은 초과 차감, 중복 지급, idempotency를 작은 모델 안에서 함께 다룰 수 있다.

### 다룰 기술

- TypeORM transaction
- conditional update
- pessimistic lock
- optimistic lock
- unique constraint
- idempotency key
- deadlock 또는 lock wait timeout의 제한 재시도 정책
- race condition 재현 테스트

### 직접 구현해야 하는 부분

- [x] 실패하는 동시성 테스트 작성
- [x] 조건부 update 전략 선택
- [x] affected row 기반 성공 여부 확인
- [x] 동시 refresh 요청 테스트 통과시키기
- [x] lock 범위 최소화
- [ ] 제한 자원 동시 차감 실패 테스트 작성
- [ ] naive read-modify-write로 초과 발급 재현
- [ ] `remaining > 0` 조건부 update와 affected row 기반 성공 판정
- [ ] 쿠폰 claim 기록과 수량 차감을 하나의 짧은 transaction으로 처리
- [ ] `(userId, couponId)` unique constraint로 중복 claim 방지
- [ ] idempotency key 저장과 재시도 처리
- [ ] pessimistic lock 비교 실험
- [ ] 동시성 해결 방식의 장단점 문서화
- [ ] 동시성 incident-style writeup 작성

### 검증 기준

- 수정 전 race condition을 테스트로 재현할 수 있다.
- [x] 수정 후 동시에 들어온 refresh 요청 중 하나만 성공한다.
- [x] 실패한 요청은 일관된 에러를 반환한다.
- [x] DB 상태가 중간 상태로 깨지지 않는다.
- [x] transaction 범위가 불필요하게 넓지 않다.
- 쿠폰 수량이 10개일 때 동시에 50~100개 claim 요청을 보내면 성공은 정확히 10개다.
- 쿠폰 수량은 음수가 되지 않는다.
- 같은 사용자가 같은 쿠폰을 동시에 여러 번 claim해도 하나만 성공한다.
- 같은 idempotency key와 같은 payload로 재시도하면 추가 차감 없이 같은 결과를 반환한다.
- 같은 idempotency key와 다른 payload로 요청하면 `409 Conflict`를 반환한다.
- 성공한 claim 기록 수와 차감된 쿠폰 수량이 일치한다.
- deadlock 또는 lock wait timeout은 제한된 횟수만 재시도하고, 비즈니스 실패는 재시도하지 않는다.

### 전략 비교 기준

- 조건부 update는 단일 row 수량 차감의 기본 해법으로 구현한다.
- unique constraint는 중복 지급 방어의 기본 해법으로 구현한다.
- idempotency key는 클라이언트 재시도와 timeout after commit을 방어하기 위해 구현한다.
- pessimistic lock은 짧은 비교 실험으로 구현한다.
- optimistic lock과 isolation level 세부 비교는 문서화 중심으로 다룬다.

### 산출물

- 실패하는 동시성 테스트
- 수정 후 통과하는 MySQL 기반 e2e 또는 integration test
- conditional update, pessimistic lock, optimistic lock, unique constraint, idempotency key 비교 문서
- 요청 A/B가 어디서 충돌하고 어디서 막히는지 보여주는 짧은 시퀀스 다이어그램
- 문제 재현, 원인, 해결, 검증을 정리한 incident-style writeup

### 이 트랙에서 다루지 않는 것

- 쿠폰, 포인트, 재고를 모두 구현하기
- 주문, 결제, 정산 도메인
- Redis distributed lock
- Saga, outbox, event sourcing
- 다중 DB transaction
- 운영용 재고 시스템 수준의 상태 모델
- 재사용 가능한 locking framework

## Track 4: Redis State and Rate Limit

### 목표

Redis를 단순 캐시가 아니라 TTL, 원자적 증가, 임시 상태 저장소로 사용해 본다. 인증 관련 blacklist와 rate limit은 첫 실습 소재로 사용하지만, 학습 목표는 Redis의 상태 관리, 원자 연산, 장애 처리 정책을 익히는 것이다.

### 구현할 기능

- access token blacklist
- [x] login rate limit
- refresh 실패 횟수 제한
- 선택 사항: session lookup cache

### Redis key 설계

```text
auth:blacklist:access-token:{jti}
login-failure:{ip}:{email}
auth:refresh-fail:{sessionId}
auth:session-cache:{sessionId}
```

`login-failure:{ip}:{email}`은 현재 구현된 로그인 실패 제한 key다. 모든 인증 임시 key는 TTL을 가져야 한다.

### 현재 구현된 login rate limit

- 기준: IP + email 조합
- 제한: 첫 실패 시점부터 60초 동안 5회 실패
- Redis 명령: `GET`, `INCR`, `EXPIRE`, `DEL`
- TTL 정책: 첫 실패로 count가 1이 될 때만 `EXPIRE 60`을 설정한다.
- 성공 처리: 로그인 성공 시 실패 카운터를 `DEL`로 삭제한다.
- 장애 정책: Redis 장애 시 fail-open으로 동작하며, 로그인 실패 제한만 일시적으로 비활성화한다.

### 직접 구현해야 하는 부분

- access token `jti` 설계
- [x] Redis client module
- [x] key prefix 관리
- [x] TTL 정책
- [x] login rate limit 증가 로직
- [x] rate limit 만료 처리
- `INCR`와 `EXPIRE` 원자성 보장 방식 결정
- access token blacklist 저장 및 조회
- [x] Redis 장애 시 에러 처리 정책

### 검증 기준

- 로그아웃한 access token은 blacklist에 들어간다.
- blacklist에 있는 access token으로 보호 API에 접근할 수 없다.
- [x] 로그인 실패가 일정 횟수를 넘으면 일시적으로 차단된다.
- [x] TTL이 없는 인증 임시 key를 만들지 않는다.
- rate limit 증가는 원자적으로 동작해야 한다.
- [x] Redis 장애 시 기능별 fail-open 또는 fail-closed 정책이 문서화되어 있다.
- [x] Redis 장애 메시지는 사용자에게 과도한 내부 정보를 노출하지 않는다.

## Track 5: API Key

### 목표

사용자 로그인과 서버 간 client 인증을 분리해서 이해한다. API key는 평문으로 저장하지 않고, 발급, 조회, 폐기, 회전을 독립된 인증 방식으로 다룬다.

### 구현할 기능

- API key 발급
- key prefix와 hash 저장
- API key guard
- key owner와 scope 관리
- last used at 기록
- API key revoke
- API key rotation

### 예상 API

```text
POST /api-keys
GET /api-keys
DELETE /api-keys/:keyId
POST /api-keys/:keyId/rotate
GET /internal/me
```

### 데이터 모델

`api_keys` 테이블은 최소한 다음 필드를 가진다.

- `id`
- `ownerId`
- `name`
- `prefix`
- `keyHash`
- `scopes`
- `lastUsedAt`
- `revokedAt`
- `createdAt`
- `updatedAt`

### 직접 구현해야 하는 부분

- API key 원문 생성
- API key hash 저장
- prefix 기반 후보 key 조회
- scope 검증
- revoke와 rotation 정책
- rotation 동시 요청 처리
- `lastUsedAt` 업데이트 빈도 제한 또는 비동기 처리 정책
- API key guard
- API key 실패 테스트

### 검증 기준

- API key 원문은 최초 발급 응답에서만 확인할 수 있다.
- API key는 DB에 평문으로 저장되지 않는다.
- 폐기된 API key는 사용할 수 없다.
- rotation 이후 이전 key는 사용할 수 없다.
- 동시에 rotation 요청을 보내도 active key 상태가 일관된다.
- scope가 부족한 API key는 보호 API에 접근할 수 없다.
- `lastUsedAt` 기록은 인증 경로의 병목이 되지 않는다.
- API key 원문과 hash는 로그와 응답에 노출되지 않는다.

## Track 6: OAuth/OIDC와 구글 로그인

### 목표

외부 identity provider를 사용하는 로그인 흐름을 경험한다.

구글 로그인은 단순히 "구글 계정으로 로그인 버튼을 붙이는 기능"이 아니다. OAuth 2.0 authorization code flow와 OIDC ID token 검증, redirect callback, account linking, provider token 저장 정책을 함께 이해해야 한다.

이 과제는 local auth, JWT, session 모델을 먼저 구현한 뒤 진행한다. 내부 사용자 모델과 세션 모델이 있어야 구글 계정으로 들어온 외부 identity를 우리 서비스의 사용자와 연결하는 문제를 제대로 다룰 수 있다.

### 구현할 기능

- Google OAuth client 설정
- Google OAuth strategy
- authorization URL 시작 endpoint
- callback endpoint
- provider profile 검증
- local user와 provider account 연결
- 구글 로그인 성공 후 내부 access token과 refresh session 발급
- 기존 이메일 계정과 구글 계정 연결 정책
- OAuth state 검증

### 예상 API

```text
GET /auth/google
GET /auth/google/callback
GET /auth/me
GET /auth/linked-accounts
DELETE /auth/linked-accounts/google
```

`GET /auth/google`은 구글 인증 화면으로 redirect한다.

`GET /auth/google/callback`은 구글 인증 후 돌아오는 callback을 처리한다.

`GET /auth/linked-accounts`는 현재 사용자에게 연결된 외부 로그인 계정을 반환한다.

`DELETE /auth/linked-accounts/google`은 구글 계정 연결을 해제한다.

### 데이터 모델

`auth_provider_accounts` 테이블은 최소한 다음 필드를 가진다.

- `id`
- `userId`
- `provider`
- `providerUserId`
- `email`
- `displayName`
- `createdAt`
- `updatedAt`

선택적으로 provider access token이나 refresh token을 저장할 수 있지만, 초기 과제에서는 저장하지 않는 것을 기본으로 한다. 저장이 필요하다면 암호화, 만료, 재발급, 폐기 정책을 별도 과제로 다룬다.

### 직접 구현해야 하는 부분

- Google OAuth strategy 설정
- OAuth 환경변수 검증
- callback 처리
- state 검증
- provider profile에서 내부 사용자 식별
- 신규 사용자 생성 또는 기존 사용자 연결
- provider account unique constraint 설계
- account linking 동시 요청 처리
- 구글 로그인 후 내부 JWT/session 발급
- 연결 해제 정책
- OAuth e2e 또는 strategy test

### 검증 기준

- 구글 callback이 성공하면 내부 사용자와 세션이 생성된다.
- 같은 구글 계정으로 다시 로그인하면 기존 사용자로 로그인된다.
- provider account는 중복 연결되지 않는다.
- 같은 provider 계정으로 동시에 callback이 들어와도 provider account는 하나만 생성된다.
- provider access token 원문은 로그에 남지 않는다.
- state가 없거나 잘못되면 callback은 실패한다.
- 구글 계정 연결을 해제하면 해당 provider login은 더 이상 사용할 수 없다.
- 구글 로그인 후에도 `/auth/me`는 기존 JWT guard로 동작한다.

### 이 과제에서 다루지 않는 것

- 여러 OAuth provider 동시 지원
- provider refresh token 장기 저장
- Google API 호출
- SAML
- WebAuthn
- 운영용 multi-factor authentication

## Track 7: BullMQ 메시지큐

### 목표

API 요청에서 느리거나 실패 가능한 작업을 분리하고, BullMQ로 백그라운드 작업을 처리한다. 이메일 인증, 비밀번호 재설정, 로그인 알림은 실습 소재이며, 핵심 목표는 retry, backoff, failed job, idempotency, worker 분리를 검증하는 것이다.

### 구현할 기능

- BullMQ queue 설정
- worker 설정
- 필수: 이메일 인증 작업 enqueue
- 선택: 비밀번호 재설정 이메일 enqueue
- 선택: 로그인 알림 enqueue
- retry 정책
- failed job 처리
- 중복 작업 방지

### 예상 작업

```text
email.verification.requested
password-reset.requested
login-notification.requested
```

실제로 이메일을 보내지 않아도 된다. 초기에는 fake mailer를 사용하고, job payload와 side effect가 올바른지 검증한다.

### 직접 구현해야 하는 부분

- Queue module
- producer service
- processor worker
- job payload 타입
- retry/backoff 설정
- max attempts와 poison job 처리 기준
- failed job 로깅
- idempotency 처리
- queue 관련 테스트

### 검증 기준

- API 요청은 느린 작업을 직접 처리하지 않고 job을 enqueue한다.
- worker는 job을 처리한다.
- 실패한 job은 retry된다.
- 영구 실패한 job은 failed 상태로 남고 로그가 남는다.
- 같은 요청이 반복되어도 중복 side effect가 발생하지 않는다.
- 같은 business key의 job이 중복 실행되어도 side effect는 한 번만 발생한다.

## Track 8: Ops Security and Observability

### 목표

각 트랙에서 만든 기능을 운영 가능한 백엔드 기준으로 점검한다. 별도의 거대한 운영 시스템을 만들지 않고, 로그, 설정, 장애 메시지, 보안 회귀 테스트를 정리한다.

### 구현할 기능

- secret과 환경변수 검증
- token, key, hash 로그 마스킹
- 인증 실패와 의심 이벤트 기록
- Redis와 queue 장애 메시지 정리
- migration과 test DB 분리 점검
- 보안 회귀 테스트 보강

### 검증 기준

- 로그에 access token, refresh token, API key, token hash, secret이 남지 않는다.
- 외부 응답은 내부 인프라 오류를 그대로 노출하지 않는다.
- 의심 이벤트는 디버깅 가능한 수준으로 기록된다.
- 각 트랙의 실패 케이스가 테스트로 남아 있다.

## 모듈 책임 분리

각 계층은 역할을 섞지 않는다.

- Controller는 HTTP 요청과 응답만 다룬다.
- DTO는 요청 데이터 검증을 담당한다.
- Service는 유스케이스를 조율한다.
- Entity는 DB 모델을 표현한다.
- Repository 또는 TypeORM manager는 DB 접근을 담당한다.
- Passport strategy는 credential 또는 token payload 검증을 담당한다.
- Guard는 라우트 접근 제어를 담당한다.
- Redis helper는 key 이름, TTL, 원자 연산을 감춘다.
- API key service는 key 발급, hash 저장, rotation, revoke만 담당한다.
- Queue producer는 job 생성만 담당한다.
- Queue processor는 job 처리만 담당한다.

함수는 가능하면 50줄 미만으로 유지한다. 파일은 하나의 책임에 집중하고, 커지면 분리한다.

## 에러 처리 기준

에러는 명확하되 민감한 정보를 노출하지 않는다.

- DTO 검증 실패는 `400 Bad Request`
- 인증 실패는 `401 Unauthorized`
- 권한 부족은 `403 Forbidden`
- 이메일 중복은 `409 Conflict`
- 존재하지 않는 리소스는 `404 Not Found`
- 인프라 장애는 내부 로그에 상세 원인을 남기고, API에는 안전한 메시지만 반환

로그인 실패 응답은 이메일이 존재하는지, 비밀번호가 틀렸는지 구체적으로 구분하지 않는다.

## 보안 기준

- 비밀번호는 평문 저장하지 않는다.
- refresh token은 평문 저장하지 않는다.
- API 응답에 password hash, refresh token hash를 포함하지 않는다.
- JWT secret은 환경변수로 관리한다.
- access token은 짧은 만료 시간을 가진다.
- refresh token은 rotation한다.
- refresh token 재사용은 의심 이벤트로 처리한다.
- Redis 인증 key는 namespace와 TTL을 가진다.
- API key는 prefix와 hash로 저장하고 원문을 로그에 남기지 않는다.
- 로그에 token 원문, key 원문, hash, secret을 남기지 않는다.

## 테스트 기준

각 트랙은 테스트를 포함해야 완료된다.

- service unit test
- Passport strategy test
- controller 또는 e2e test
- 실패 케이스 테스트
- 보안 회귀 테스트
- 동시성 트랙에서는 race condition 테스트
- 메시지큐 트랙에서는 enqueue 및 worker 테스트
- 운영 보안 트랙에서는 민감정보 노출 회귀 테스트

검증 명령은 프로젝트 생성 후 다음 형태를 목표로 한다.

```text
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

## 확정된 구현 기준

프로젝트 방향은 다음 기준으로 고정한다.

- NestJS 백엔드 학습 랩으로 유지한다.
- 인증은 첫 번째 큰 트랙이지만 전체 프로젝트 범위는 아니다.
- MySQL과 TypeORM을 기본 데이터 저장 계층으로 사용한다.
- Passport 기반 local, JWT, session, API key, OAuth/OIDC 실습을 순차적으로 진행한다.
- Redis, DB 동시성, BullMQ는 인증 보조 기능이 아니라 독립 백엔드 학습 트랙으로 다룬다.
- 프론트엔드, FastAPI, Supabase, PostgreSQL은 이 저장소 범위에 포함하지 않는다.
- 첫 번째 정리 목표는 빌드 가능한 NestJS 기준선을 만드는 것이다.

## 하지 않을 것

- 프론트엔드 구현
- Supabase 사용
- 완성형 인증 서버 제공
- 첫 스켈레톤에 모든 정답 로직 포함
- 운영 수준의 identity provider 구축

## 완료 기준

이 설계는 다음 조건을 만족하면 완료된 것으로 본다.

- 프로젝트 목적이 Auth를 첫 트랙으로 삼는 NestJS 백엔드 학습 랩으로 명확하다.
- 기술 스택이 NestJS, Passport, MySQL, TypeORM, Redis, BullMQ로 고정되어 있다.
- 학습자가 직접 구현할 부분과 에이전트가 제공할 스켈레톤 범위가 분리되어 있다.
- 각 트랙의 목표, 구현 범위, 검증 기준이 문서만 보고 이해 가능하다.
- 다음 단계에서 구현 계획을 작성할 수 있을 만큼 범위가 좁혀져 있다.

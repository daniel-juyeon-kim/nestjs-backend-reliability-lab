# 인증 학습 랩 설계서

## 목표

이 프로젝트는 인증, JWT, 세션, Passport, Redis, 동시성, 메시지큐를 직접 구현하면서 학습하기 위한 백엔드 실습 프로젝트다. 하나의 정답 인증 방식만 익히는 것이 아니라, 여러 인증 방식을 직접 구현하고 비교하면서 각각의 장단점과 사용 맥락을 이해하는 것을 목표로 한다.

완성된 인증 서버를 한 번에 제공하는 것이 목적이 아니다. 프로젝트는 실행 가능한 NestJS 인증 백엔드를 점진적으로 만들고, 각 인증 개념을 작은 단위로 구현한 뒤 테스트와 코드 리뷰로 검증한다. 학습자는 핵심 인증 로직을 직접 작성하고, 에이전트는 구현 후 코드 리뷰, 테스트 보강, 인프라 정리를 지원한다.

## 학습 원칙

- 코드는 학습자가 직접 작성한다.
- 에이전트는 먼저 완성 구현을 제공하지 않는다.
- 과제는 작게 나누고, 각 과제는 테스트와 리뷰를 통과해야 완료된다.
- 막혔을 때는 정답 코드보다 힌트, 설계 방향, 디버깅 순서를 먼저 제공한다.
- 인증 보안, 인증 방식 간 trade-off, 데이터 모델, 트랜잭션, Redis TTL, 큐 재시도처럼 실제 백엔드에서 중요한 지점을 우선한다.

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
- `.env.example`

아직 구현하지 않는다:

- 완성된 refresh token 회전 로직
- 완성된 Redis rate limit
- 완성된 동시성 제어 코드
- 완성된 BullMQ worker

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

## 과제 1: Local Auth와 JWT Access Token

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

## 과제 1.5: 인증 방식 비교

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

## 과제 2: Refresh Token과 Session 모델

### 목표

JWT만 사용하는 인증과 서버 세션을 함께 사용하는 인증의 차이를 익힌다.

Access token은 짧게 유지하고, refresh token은 서버 세션과 연결한다. Refresh token은 평문 저장하지 않고 해시해서 저장한다.

이 과제는 과제 1의 stateless JWT 방식과 과제 1.5의 stateful session 방식을 바탕으로 hybrid 인증 방식을 구현하는 단계다.

### 구현할 기능

- [x] refresh token 저장 테이블 생성
- [x] 로그인 시 access token과 refresh token 발급
- [x] refresh token 해시 저장
- [x] refresh token으로 access token 재발급
- [ ] refresh token rotation
- [ ] 로그아웃
- [ ] refresh token 만료 처리
- [ ] refresh token 폐기
- [ ] refresh token 재사용 감지

### 예상 API

```text
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET /auth/sessions
DELETE /auth/sessions/:sessionId
```

`POST /auth/refresh`는 refresh token을 받아 유효한 active token hash와 비교한 뒤 새 access token을 발급한다.

현재 단계에서는 rotation을 적용하지 않는다. 즉 refresh 성공 시 새 refresh token은 아직 발급하지 않고, 기존 refresh token도 폐기하지 않는다. Rotation은 다음 학습 단계에서 구현한다.

`POST /auth/logout`은 현재 세션을 폐기한다.

`GET /auth/sessions`는 현재 사용자의 활성 세션 목록을 반환한다.

`DELETE /auth/sessions/:sessionId`는 특정 세션을 폐기한다.

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
- refresh token rotation
- 폐기된 refresh token 처리
- 만료된 refresh token 처리
- 재사용 감지 정책 결정
- 로그아웃 API

### 검증 기준

- 로그인할 때마다 새 refresh token이 생성된다.
- refresh token은 DB에 평문으로 저장되지 않는다.
- refresh 요청이 성공하면 새 access token을 받을 수 있다.
- rotation 단계 이후에는 refresh 요청이 성공하면 기존 refresh token은 더 이상 사용할 수 없다.
- 로그아웃 후 같은 refresh token으로 재발급할 수 없다.
- 만료된 refresh token은 refresh에 실패한다.
- 폐기된 refresh token은 refresh에 실패한다.
- API 응답에는 민감한 token hash가 포함되지 않는다.

## 과제 3: Redis 기반 인증 상태 관리

### 목표

Redis를 단순 캐시가 아니라 TTL, 원자적 증가, 임시 인증 상태 저장소로 사용해 본다.

### 구현할 기능

- access token blacklist
- login rate limit
- refresh 실패 횟수 제한
- 선택 사항: session lookup cache

### Redis key 설계 예시

```text
auth:blacklist:access-token:{jti}
auth:rate-limit:login:{email-or-ip}
auth:refresh-fail:{sessionId}
auth:session-cache:{sessionId}
```

실제 key 이름은 구현 시 확정한다. 모든 임시 key는 TTL을 가져야 한다.

### 직접 구현해야 하는 부분

- Redis client module
- key prefix 관리
- TTL 정책
- login rate limit 증가 로직
- rate limit 만료 처리
- access token blacklist 저장 및 조회
- Redis 장애 시 에러 처리 정책

### 검증 기준

- 로그아웃한 access token은 blacklist에 들어간다.
- blacklist에 있는 access token으로 보호 API에 접근할 수 없다.
- 로그인 실패가 일정 횟수를 넘으면 일시적으로 차단된다.
- rate limit 증가는 원자적으로 동작해야 한다.
- TTL이 없는 인증 임시 key를 만들지 않는다.
- Redis 장애 메시지는 사용자에게 과도한 내부 정보를 노출하지 않는다.

## 과제 4: 동시성 실습

### 목표

동시에 들어오는 요청이 인증 상태를 꼬이게 만드는 상황을 재현하고 해결한다.

특히 refresh token rotation은 동시성 문제가 발생하기 좋은 주제다. 같은 refresh token으로 거의 동시에 두 요청이 들어오면 둘 다 성공하면 안 된다.

### 실습 후보

1. 동시에 같은 refresh token으로 재발급 요청을 보냈을 때 하나만 성공하게 만들기
2. refresh token 재사용을 감지하고 세션을 폐기하기
3. 쿠폰 또는 포인트 같은 제한 자원을 만들어 동시 차감 문제 해결하기

### 다룰 기술

- TypeORM transaction
- pessimistic lock
- optimistic lock
- unique constraint
- idempotency key
- race condition 재현 테스트

### 직접 구현해야 하는 부분

- 실패하는 동시성 테스트 작성
- transaction 경계 설정
- lock 전략 선택
- lock 적용 후 테스트 통과시키기
- lock 범위 최소화
- 동시성 해결 방식의 장단점 문서화

### 검증 기준

- 수정 전 race condition을 테스트로 재현할 수 있다.
- 수정 후 동시에 들어온 refresh 요청 중 하나만 성공한다.
- 실패한 요청은 일관된 에러를 반환한다.
- DB 상태가 중간 상태로 깨지지 않는다.
- transaction 범위가 불필요하게 넓지 않다.

## 과제 5: OAuth/OIDC와 구글 로그인

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
- 구글 로그인 후 내부 JWT/session 발급
- 연결 해제 정책
- OAuth e2e 또는 strategy test

### 검증 기준

- 구글 callback이 성공하면 내부 사용자와 세션이 생성된다.
- 같은 구글 계정으로 다시 로그인하면 기존 사용자로 로그인된다.
- provider account는 중복 연결되지 않는다.
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

## 과제 6: 메시지큐

### 목표

API 요청에서 느리거나 실패 가능한 작업을 분리하고, BullMQ로 백그라운드 작업을 처리한다.

### 구현할 기능

- BullMQ queue 설정
- worker 설정
- 이메일 인증 작업 enqueue
- 비밀번호 재설정 이메일 enqueue
- 로그인 알림 enqueue
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
- failed job 로깅
- idempotency 처리
- queue 관련 테스트

### 검증 기준

- API 요청은 느린 작업을 직접 처리하지 않고 job을 enqueue한다.
- worker는 job을 처리한다.
- 실패한 job은 retry된다.
- 영구 실패한 job은 failed 상태로 남고 로그가 남는다.
- 같은 요청이 반복되어도 중복 side effect가 발생하지 않는다.

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
- 로그에 token 원문을 남기지 않는다.

## 테스트 기준

각 과제는 테스트를 포함해야 완료된다.

- service unit test
- Passport strategy test
- controller 또는 e2e test
- 실패 케이스 테스트
- 보안 회귀 테스트
- 동시성 과제에서는 race condition 테스트
- 메시지큐 과제에서는 enqueue 및 worker 테스트

검증 명령은 프로젝트 생성 후 다음 형태를 목표로 한다.

```text
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

## 확정된 구현 기준

프로젝트 방향은 다음 기준으로 고정한다.

- NestJS 인증 학습 백엔드로 유지한다.
- MySQL과 TypeORM을 기본 데이터 저장 계층으로 사용한다.
- Passport 기반 local, JWT, session, API key, OAuth/OIDC 실습을 순차적으로 진행한다.
- Redis와 BullMQ는 후속 과제에서 인증 상태 관리와 메시지큐 학습에 사용한다.
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

- 프로젝트 목적이 학습용 인증 랩으로 명확하다.
- 기술 스택이 NestJS, Passport, MySQL, TypeORM, Redis, BullMQ로 고정되어 있다.
- 학습자가 직접 구현할 부분과 에이전트가 제공할 스켈레톤 범위가 분리되어 있다.
- 각 과제의 목표, 구현 범위, 검증 기준이 문서만 보고 이해 가능하다.
- 다음 단계에서 구현 계획을 작성할 수 있을 만큼 범위가 좁혀져 있다.

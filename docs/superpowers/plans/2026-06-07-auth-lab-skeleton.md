# Auth Lab Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable NestJS skeleton for the authentication learning lab without implementing the full auth assignments.

**Architecture:** The project provides local infrastructure, configuration, module boundaries, TypeORM entities, Passport strategy shells, tests, and the first assignment document. Signup, login, JWT issuing, refresh sessions, Redis auth state, OAuth login, concurrency fixes, and queue workers remain learner assignments.

**Tech Stack:** NestJS, TypeScript, Passport, TypeORM, MySQL, Redis, Docker Compose, Jest, npm.

---

## File Structure

```text
.
  compose.yml
  package.json
  tsconfig.json
  tsconfig.build.json
  nest-cli.json
  eslint.config.mjs
  .prettierrc
  .env.example
  README.md
  src/
    main.ts
    app.module.ts
    config/env.schema.ts
    config/app.config.ts
    config/typeorm.config.ts
    config/redis.config.ts
    health/health.controller.ts
    health/health.module.ts
    health/health.service.ts
    users/dto/create-user.dto.ts
    users/entities/user.entity.ts
    users/users.module.ts
    users/users.service.ts
    auth/auth.controller.ts
    auth/auth.module.ts
    auth/auth.service.ts
    auth/dto/auth-response.dto.ts
    auth/dto/login.dto.ts
    auth/dto/register.dto.ts
    auth/guards/jwt-auth.guard.ts
    auth/guards/local-auth.guard.ts
    auth/strategies/jwt.strategy.ts
    auth/strategies/local.strategy.ts
  test/
    health.e2e-spec.ts
    auth.e2e-spec.ts
    jest-e2e.json
  docs/assignments/01-local-auth-jwt.md
```

## Task 1: Project Metadata

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.build.json`
- Create: `nest-cli.json`
- Create: `eslint.config.mjs`
- Create: `.prettierrc`
- Create: `.gitignore`

- [ ] **Step 1: Add npm metadata and scripts**

Create `package.json` with these scripts and dependency groups:

```json
{
  "name": "learn-auth",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "lint": "eslint \"{src,test}/**/*.ts\"",
    "format": "prettier --write \"{src,test,docs}/**/*.{ts,md,json}\"",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

Add runtime dependencies:

```text
@nestjs/common @nestjs/config @nestjs/core @nestjs/jwt @nestjs/passport
@nestjs/platform-express @nestjs/typeorm bcrypt class-transformer
class-validator ioredis mysql2 passport passport-jwt passport-local
reflect-metadata rxjs typeorm zod
```

Add dev dependencies:

```text
@nestjs/cli @nestjs/schematics @nestjs/testing @types/bcrypt @types/express
@types/jest @types/node @types/passport-jwt @types/passport-local
@types/supertest @typescript-eslint/eslint-plugin @typescript-eslint/parser
eslint eslint-config-prettier jest prettier source-map-support supertest
ts-jest ts-loader ts-node tsconfig-paths typescript
```

- [ ] **Step 2: Add TypeScript and Nest config**

`tsconfig.json` must enable strict mode, decorators, metadata emit, `ES2021`, `commonjs`, and `outDir: "./dist"`.

`tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

`nest-cli.json`:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
```

- [ ] **Step 3: Add lint, format, and ignore config**

`eslint.config.mjs` must use `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, and `eslint-config-prettier`.

`.prettierrc`:

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

`.gitignore`:

```text
node_modules
dist
coverage
.env
.env.local
*.log
```

- [ ] **Step 4: Install and commit**

Run:

```bash
npm install
git add package.json package-lock.json tsconfig.json tsconfig.build.json nest-cli.json eslint.config.mjs .prettierrc .gitignore
git commit -m "chore: add nest project tooling"
```

Expected: dependencies install and `package-lock.json` exists.

## Task 2: Local Infrastructure

**Files:**
- Create: `compose.yml`
- Create: `.env.example`
- Create: `README.md`

- [ ] **Step 1: Add MySQL and Redis Compose services**

`compose.yml`:

```yaml
services:
  mysql:
    image: mysql:8.4
    container_name: learn-auth-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: learn_auth
      MYSQL_USER: learn_auth
      MYSQL_PASSWORD: learn_auth_password
    ports:
      - '3306:3306'
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost']
      interval: 5s
      timeout: 5s
      retries: 20
  redis:
    image: redis:7.2
    container_name: learn-auth-redis
    ports:
      - '6379:6379'
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 5s
      retries: 20
volumes:
  mysql_data:
```

- [ ] **Step 2: Add environment example**

`.env.example`:

```text
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=learn_auth
DB_PASSWORD=learn_auth_password
DB_NAME=learn_auth
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_ACCESS_SECRET=replace_me_with_a_long_local_secret
JWT_ACCESS_EXPIRES_IN=15m
```

- [ ] **Step 3: Add README setup**

`README.md` must document:

```bash
cp .env.example .env
docker compose up -d
npm install
npm run start:dev
```

It must state that auth logic is intentionally left for assignments.

- [ ] **Step 4: Validate and commit**

Run:

```bash
docker compose config
git add compose.yml .env.example README.md
git commit -m "chore: add local mysql and redis infrastructure"
```

Expected: Compose config resolves without errors.

## Task 3: App Bootstrap And Configuration

**Files:**
- Create: `src/main.ts`
- Create: `src/app.module.ts`
- Create: `src/config/env.schema.ts`
- Create: `src/config/app.config.ts`
- Create: `src/config/typeorm.config.ts`
- Create: `src/config/redis.config.ts`

- [ ] **Step 1: Add env validation**

`src/config/env.schema.ts`:

```ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive(),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().positive(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1),
});

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);
  if (parsed.success) return parsed.data;

  const fields = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
  throw new Error(`Invalid environment variables: ${fields}`);
}
```

- [ ] **Step 2: Add config factories**

Create `app.config.ts`, `typeorm.config.ts`, and `redis.config.ts` using `registerAs`. TypeORM config must use MySQL, the `User` entity, and `synchronize: process.env.NODE_ENV !== 'production'`.

- [ ] **Step 3: Add app module and bootstrap**

`AppModule` must import `ConfigModule.forRoot`, `TypeOrmModule.forRootAsync`, `HealthModule`, `UsersModule`, and `AuthModule`.

`main.ts` must create the Nest app, enable global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and `transform`, then listen on `app.port`.

- [ ] **Step 4: Defer commit**

Do not commit yet. This task references modules created in Tasks 4 and 5.

## Task 4: Health And Users Modules

**Files:**
- Create: `src/health/health.controller.ts`
- Create: `src/health/health.module.ts`
- Create: `src/health/health.service.ts`
- Create: `src/users/dto/create-user.dto.ts`
- Create: `src/users/entities/user.entity.ts`
- Create: `src/users/users.module.ts`
- Create: `src/users/users.service.ts`

- [ ] **Step 1: Add `User` entity**

`User` must map to `users` and include `id`, `email`, `passwordHash`, `createdAt`, `updatedAt`. Email must be unique. Use UUID primary keys.

- [ ] **Step 2: Add user DTO and service**

`CreateUserDto` must validate email and a minimum 8-character password.

`UsersService` must inject `Repository<User>`, provide `findByEmail`, `findById`, and make `create` throw:

```ts
throw new Error('Assignment 1: implement user creation with password hashing.');
```

- [ ] **Step 3: Add health endpoint**

`GET /health` must return:

```json
{"status":"ok","service":"learn-auth"}
```

- [ ] **Step 4: Defer commit**

Do not commit yet. Compile after AuthModule exists.

## Task 5: Auth Module Skeleton

**Files:**
- Create all files under `src/auth/` listed in the file structure.

- [ ] **Step 1: Add auth DTOs**

`RegisterDto` and `LoginDto` must validate email and a minimum 8-character password.

`AuthResponseDto` must contain:

```ts
export type AuthUserResponse = { id: string; email: string };
export type AuthResponseDto = { accessToken: string; user: AuthUserResponse };
```

- [ ] **Step 2: Add auth service markers**

`AuthService` must expose `register`, `login`, `validateLocalUser`, and `validateJwtUser`. Each method must throw a descriptive assignment error instead of implementing auth.

- [ ] **Step 3: Add Passport guards and strategies**

Create `LocalAuthGuard extends AuthGuard('local')` and `JwtAuthGuard extends AuthGuard('jwt')`.

Create `LocalStrategy` with `usernameField: 'email'` and delegate validation to `AuthService.validateLocalUser`.

Create `JwtStrategy` with bearer-token extraction, `app.jwtAccessSecret`, and this payload:

```ts
export type JwtPayload = {
  sub: string;
  email: string;
};
```

- [ ] **Step 4: Add auth controller and module**

`AuthController` must define:

```text
POST /auth/register
POST /auth/login
GET /auth/me
```

`/auth/login` must use `LocalAuthGuard`. `/auth/me` must use `JwtAuthGuard`.

`AuthModule` must import `PassportModule`, `JwtModule.register({})`, and `UsersModule`.

- [ ] **Step 5: Validate and commit Tasks 3-5**

Run:

```bash
npm run typecheck
npm run lint
git add src
git commit -m "feat: add auth lab application skeleton"
```

Expected: typecheck and lint pass.

## Task 6: Test Skeletons

**Files:**
- Create: `test/jest-e2e.json`
- Create: `test/health.e2e-spec.ts`
- Create: `test/auth.e2e-spec.ts`

- [ ] **Step 1: Add e2e config**

`test/jest-e2e.json` must run `*.e2e-spec.ts` with `ts-jest` and `testEnvironment: "node"`.

- [ ] **Step 2: Add health e2e test**

Test `GET /health` and expect:

```json
{"status":"ok","service":"learn-auth"}
```

- [ ] **Step 3: Add auth assignment todos**

`test/auth.e2e-spec.ts`:

```ts
describe('Auth Assignment 1', () => {
  it.todo('registers a new user with a hashed password');
  it.todo('rejects duplicate email registration');
  it.todo('logs in with valid credentials');
  it.todo('rejects invalid credentials without revealing which field failed');
  it.todo('rejects /auth/me without a JWT');
  it.todo('returns the current user with a valid JWT');
});
```

- [ ] **Step 4: Validate and commit**

Run:

```bash
npm run test:e2e
git add test
git commit -m "test: add auth lab e2e skeletons"
```

Expected: health e2e passes and auth tests are listed as todo.

## Task 7: First Assignment Document

**Files:**
- Create: `docs/assignments/01-local-auth-jwt.md`

- [ ] **Step 1: Write assignment**

The document must cover:

- goal: Local Auth and JWT Access Token
- APIs: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- requirements: duplicate email rejection, password hashing, Passport local login, JWT issuing, JWT guard
- limits: no refresh token, no Redis, no logout, no social login
- validation commands: lint, typecheck, unit test, e2e test
- review checklist: no password hash in responses, generic auth failure, minimal JWT payload, focused services

- [ ] **Step 2: Format and commit**

Run:

```bash
npm run format
git add docs/assignments/01-local-auth-jwt.md
git commit -m "docs: add first auth assignment"
```

Expected: assignment is formatted and committed.

## Task 8: Final Validation

**Files:**
- Modify earlier files only if validation finds issues.

- [ ] **Step 1: Start infrastructure**

Run:

```bash
docker compose up -d
```

Expected: MySQL and Redis containers become healthy.

- [ ] **Step 2: Run validation**

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

Expected: all commands pass. Auth tests remain todo until the learner starts Assignment 1.

- [ ] **Step 3: Verify running API**

Run:

```bash
npm run start:dev
curl http://localhost:3000/health
```

Expected:

```json
{"status":"ok","service":"learn-auth"}
```

- [ ] **Step 4: Commit validation fixes**

If validation required file changes:

```bash
git add .
git commit -m "chore: validate auth lab skeleton"
```

Skip this commit if no files changed.

## Self-Review

- Spec coverage: Covers the initial runnable skeleton, Docker Compose MySQL/Redis, TypeORM config, HealthModule, UsersModule, AuthModule, tests, and first assignment document.
- Intentional gaps: Full auth, refresh sessions, Redis auth state, concurrency, OAuth, and queues are left for learner assignments.
- Placeholder scan: Assignment marker errors are intentional and user-facing. There are no unresolved planning placeholders.
- Type consistency: `User`, `AuthResponseDto`, `RegisterDto`, `JwtPayload`, and route names match across tasks.

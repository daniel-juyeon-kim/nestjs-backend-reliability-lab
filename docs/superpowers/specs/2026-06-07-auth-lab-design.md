# Auth Lab Design

## Goal

Build a learning-focused backend project for practicing authentication, JWT, sessions, Passport, Redis, concurrency, and message queues.

The project should not be a finished auth service handed to the learner. It should provide a thin, runnable NestJS skeleton and leave the core authentication behavior as assignment work.

## Learning Loop

Each module follows the same loop:

1. The agent writes a focused assignment with requirements, constraints, API expectations, and validation criteria.
2. The learner implements the code directly.
3. The agent reviews the implementation for correctness, security, structure, and tests.
4. The agent gives minimal hints only when the learner is blocked.
5. The next assignment starts only after linting and tests pass.

The default feedback mode is code review, not pair implementation.

## Technology Choices

- Runtime: Node.js with NestJS.
- Auth framework: Passport with local and JWT strategies.
- Database: MySQL.
- ORM: TypeORM.
- Local infrastructure: Docker Compose, expected to run through OrbStack.
- Cache and queue backend: Redis.
- Queue library: BullMQ when message queue assignments begin.
- Test style: unit tests for services and strategies, e2e tests for auth flows.

## Initial Skeleton Scope

The initial project skeleton should include only the infrastructure needed for the learner to start coding assignments:

- NestJS application setup.
- Docker Compose services for MySQL and Redis.
- TypeORM MySQL connection.
- environment configuration and validation.
- `HealthModule` for checking app, database, and Redis readiness.
- `UsersModule` with entity/repository boundaries prepared.
- `AuthModule` with empty services, guards, strategies, DTOs, and assignment markers.
- test setup for unit and e2e tests.
- `docs/assignments/` with the first assignment document.

The skeleton must not include a complete implementation of signup, login, token issuing, refresh token rotation, Redis rate limiting, locking, or queue workers.

## Assignment Roadmap

### Assignment 1: Local Auth and JWT Access Token

Primary topics:

- user registration.
- password hashing.
- login with Passport local strategy.
- JWT access token issuing.
- Passport JWT strategy.
- protecting routes with a JWT guard.

Storage:

- MySQL `users` table.

Redis:

- Redis is available but not required in this assignment.

Validation:

- duplicate emails are rejected.
- invalid credentials are rejected.
- password hashes are never returned.
- protected routes require a valid access token.
- unit and e2e tests cover happy paths and failure paths.

### Assignment 2: Refresh Token and Session Model

Primary topics:

- server-side session records.
- refresh token hashing.
- token rotation.
- logout.
- session expiration.
- refresh token reuse detection.

Storage:

- MySQL `auth_sessions` table.

Validation:

- refresh tokens are never stored in plain text.
- each login creates a session.
- logout revokes the session.
- token refresh rotates the stored token hash.
- expired or revoked sessions cannot refresh tokens.

### Assignment 3: Redis for Auth State

Primary topics:

- TTL-based auth state.
- access token blacklist.
- login rate limiting.
- optional session lookup caching.

Validation:

- Redis keys use explicit prefixes.
- all temporary auth state has TTL.
- rate limiting is atomic.
- Redis failures return user-friendly errors where appropriate.

### Assignment 4: Concurrency Practice

Primary topics:

- concurrent refresh requests.
- transaction boundaries.
- pessimistic row locking.
- optimistic locking.
- idempotency.

Candidate exercises:

- prevent two simultaneous refresh requests from both succeeding.
- detect refresh token reuse without corrupting session state.
- add a limited resource exercise such as coupons or points to compare lock strategies.

Validation:

- tests reproduce the race condition before the fix.
- tests verify only one concurrent operation succeeds when required.
- transaction scope is minimal and explicit.

### Assignment 5: Message Queue

Primary topics:

- BullMQ workers.
- background email or notification jobs.
- retries.
- failed job handling.
- idempotent job processing.

Candidate jobs:

- email verification.
- login notification.
- password reset email.

Validation:

- API requests enqueue jobs without doing slow work inline.
- workers can retry transient failures.
- duplicate jobs do not create duplicate side effects.

## Architecture Boundaries

Modules should stay small and role-specific:

- Controllers handle HTTP input and output only.
- DTOs validate request bodies.
- Services orchestrate use cases.
- Entities model persistence.
- Passport strategies validate credentials and token payloads.
- Guards protect routes.
- Redis helpers isolate key naming, TTLs, and atomic operations.
- Queue producers and processors are separated.

Functions should stay under 50 lines where practical. Files should remain focused and split before they become hard to review.

## Error Handling

Errors should be explicit and learner-friendly:

- validation failures return clear 400 responses.
- invalid credentials return a generic unauthorized response.
- duplicate registration returns a conflict response.
- revoked or expired sessions return unauthorized responses.
- infrastructure failures are logged with internal details but return safe public messages.

The implementation should avoid leaking whether a user exists during login.

## Security Constraints

- Passwords must be hashed with a suitable password hashing algorithm.
- Password hashes and refresh token hashes must never be returned by API responses.
- JWT secrets and token TTLs must come from environment configuration.
- Refresh tokens must be stored hashed.
- Access tokens should be short-lived.
- Refresh token rotation should invalidate the previous token.
- Redis auth keys must use namespaces and TTLs.

## Testing Strategy

Each assignment should include tests before it is considered complete:

- unit tests for pure service behavior.
- strategy tests for Passport validation.
- e2e tests for HTTP auth flows.
- concurrency tests where race conditions are the topic.
- queue tests for job enqueueing and worker behavior.

The validation command set should include linting, type checking, unit tests, and e2e tests once those scripts exist.

## Non-Goals

- Building a production-ready identity provider.
- Adding OAuth providers in the first phase.
- Building a frontend.
- Implementing complete auth logic in the starter skeleton.
- Using Supabase for this project.

## Implementation Planning Defaults

- Package manager: npm.
- Project setup: use the NestJS CLI shape, but keep generated code minimal and reviewable.
- Assignment tests: provide failing or skipped tests progressively per assignment, not all at once.
- Database admin UI: do not include one in the initial skeleton.

# Project Agent Instructions

## Project Direction
- This repository is a NestJS backend learning lab.
- Authentication is the first major track, not the full project scope.
- Keep the backend stack on NestJS, Passport, MySQL, and TypeORM.
- Do not introduce Next.js, FastAPI, Supabase, or PostgreSQL unless the project direction is explicitly changed.
- Redis, BullMQ, OAuth/OIDC, API keys, and concurrency exercises are independent later learning tracks, not the first implementation target.

## Workflow
- Follow Research -> Plan -> Act -> Validate.
- Before multi-file edits, state a concise plan.
- After code or config changes, run the relevant validation command.

## Coding Standards
- Keep functions under 50 lines.
- Prefer small files with one clear responsibility.
- Use immutable object and array updates.
- Use descriptive, user-safe error messages.
- Do not expose password hashes, refresh token hashes, access tokens, or secrets in logs or API responses.
- Do not use emojis in code, comments, or documentation.

## Validation Targets
- `npm run build`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`

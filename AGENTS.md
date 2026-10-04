# ANORCAR Backend Agent Instruction

ANORCAR is a NestJS GraphQL monorepo migrated from Real estate platform into a carshop platform

## Read First

Before changing code, read the current AI handoff docs:

-`docs/ai/BACKEND_MIGRATION.md`
\-`docs/ai/COMPLETED_TASKS.md`
\-`docs/ai/DECISIONS.md`
\-`docs/ai/NEXT_STEPS.md`

Use those files as the source of truth for AI Agent related migration history, accepted decisions, remaining work and validation status.

## Project Shape

-Backend apps are `anorcar-api` and `anorcar-batch`,
-Keep the existing NestJS resolver/service/module pattern based on MVC and DI.
-Keep DTOs, enums, schemas under `apps/anorcar-api/src/libs`,
-Keep shared modules reusable: auth, member, like, view, comment, follow, board article socket.

## Domain Rules

-Use Anorcar/product terminology for the main catalog entity.
-Do not reitroduce property or real-estate fields
-Keep 'MemberType.USER', 'MemberType.ADMIN' AND 'MemberType.AGENT' unchanged.

- Car ownership continues to use 'MemberType.AGENT' unless a later migration explicitly changes it.
- Car enum values are:
- `CarFuelType`: `GASOLINE`, `DIESEL`, `HYBRID`, `ELECTRIC`, `LPG`
- `CarCondition`: `USED', `NEW`,
- `CarTransmission`: `AVTOMATIC`, `MANUAL`
-

## Workflow

1. Anylyze before editing.
2. Keep changes small and consistent with existing project pattern.
3. Do not remove working logic unless it is replaced safely.
4. Update `docs/ai/COMPLETED_TASKS.md` after major completed work.
   Add or update focused tests when behavior changes.

## Validation

Use these checks for backend work

```bash
npx tsc -p apps/anorcar-api/tsconfig.app.json --noEmit
npx tsc -p apps/anorcar-batch/tsconfig.app.json --noEmit
npx run build
```

'npm run lint' runs ESLint with `--fix`, so use it only when file rewriting is acceptable!

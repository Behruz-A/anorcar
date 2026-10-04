# Reusable Codex Prompts

## Session prompts worth retaining

### Analyze the monorepo

```text
Analyze the current NestJS monorepo before making changes. Inventory application boundaries, Nest workspace configuration, GraphQL modules and operations, MongoDB schemas and collections, cross-application imports, tests, build scripts, and remaining legacy branding. Report coupling and migration risks with exact repository evidence. Do not edit files.
```

### Plan a safe branding rename

```text
Plan a branding-only rename from NESTAR to ANORCAR. Rename visible package, workspace, application, build-path, documentation, and user-facing branding identifiers. Do not change GraphQL contracts, DTOs, MongoDB models or collections, environment keys, or business logic. Include verification and rollback criteria.
```

### Implement a contract-safe rename

```text
Implement the approved NESTAR-to-ANORCAR branding plan. Preserve all GraphQL and MongoDB contracts. Before editing, record git status and enumerate every legacy reference. Afterward, prove unchanged schema/domain files are byte-identical, run a case-insensitive legacy-name search, typecheck, build each Nest application, run available tests, and review the final diff for scope violations.
```

### Verify GraphQL and MongoDB compatibility

```text
Audit this refactor for API and persistence compatibility. Compare GraphQL operation/type/field names and Mongoose model/field/index/collection definitions against the base revision. Report every semantic difference. Do not modify files.
```

### Inspect frontend API usage

```text
Inspect the Next.js frontend and create a verified matrix of routes, components, hooks, GraphQL documents, generated types, Apollo cache policies, and UI labels that depend on Property or Agent concepts. Use actual paths and symbols. Do not propose renames until the inventory is complete.
```

### Design the future Car migration

```text
Design a decision-complete migration from the current Property/Agent domain to Car/Dealer. Start from the live GraphQL operations, DTOs, Mongoose schemas, engagement groups, member counters, batch ranking, and frontend consumers. Specify the Car schema, enum values, API compatibility window, data migration, rollback, tests, and deployment order. Do not implement until all breaking-contract decisions are explicit.
```

### Repair tooling without domain changes

```text
Repair the repository's lint, typecheck, build, and test tooling without changing runtime behavior or domain logic. Diagnose dependency/configuration mismatches first. Keep formatting-only changes separate, add check-only scripts, and report pre-existing findings rather than silently rewriting unrelated source.
```

## Next-session handoff prompt

```text
Continue work on the ANORCAR NestJS monorepo. The completed migration was branding-only: package and app identifiers are ANORCAR, while GraphQL and MongoDB remain Property/Agent based. Applications are apps/anorcar-api and apps/anorcar-batch. Typecheck and both builds passed; schema files were verified unchanged. ESLint is not clean because the configured typescript-eslint meta-package is missing and the existing code has substantial lint debt. No Next.js frontend is present in this workspace.

Read AGENTS.md and docs/BACKEND_MIGRATION.md, docs/DECISIONS.md, docs/COMPLETED_TASKS.md, and docs/NEXT_STEPS.md first. Inspect current git status before acting. Keep branding/tooling work separate from the proposed Property-to-Car and Agent-to-Dealer domain migration. Do not change public GraphQL or MongoDB contracts unless the task explicitly approves a compatibility and data-migration strategy.
```

## Prompt template for focused changes

```text
Goal: <single concrete outcome>
Allowed scope: <directories/files/subsystems>
Out of scope: business logic, GraphQL contracts, MongoDB persistence, and unrelated formatting unless explicitly listed
Compatibility requirement: <backward-compatible or approved breaking change>
Required inspection: git status, affected imports/callers, schemas/contracts, and tests
Required validation: check-only lint, tsc --noEmit, named Nest builds, relevant tests, legacy/reference search, and diff review
Deliverable: implementation plus a concise list of changed files, validation results, known failures, and follow-up work
```

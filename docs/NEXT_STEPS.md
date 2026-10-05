# Next Steps

These tasks follow the completed Property-to-Car backend conversion.

## 1. Backend cleanup

1. Align the ESLint configuration with installed dependencies: either add the compatible `typescript-eslint` meta-package or rewrite the flat config for the installed parser/plugin versions.
2. Establish and record a lint baseline; separate automatic formatting from semantic lint corrections.
3. Add check-only scripts for `typecheck`, `lint:check`, `build:api`, and `build:batch` while retaining explicit fix commands separately.
4. Fix test scaffolding expectations and isolate application startup from external MongoDB where practical.
5. Coordinate frontend deployment against the breaking Car/Brand GraphQL contract.
6. Seed production Brand records before allowing agents to create cars.

## 2. Frontend migration

1. Obtain the Next.js frontend repository and its target branch.
2. Inventory actual routes, components, GraphQL documents, generated types, Apollo cache policies, environment keys, assets, and NESTAR copy.
3. Replace the contract-based assumptions in `FRONTEND_MIGRATION.md` with verified paths and owners.
4. Apply ANORCAR visual and metadata branding without changing Property API calls.
5. Replace Property documents with the implemented Car/Brand operations.
6. Migrate browse, detail, forms, account inventory, favorites, and admin pages in that order.

## 3. Testing

1. Add isolated service tests for auth, member, property, engagement counters, and batch ranking.
2. Introduce a test MongoDB strategy or mock providers so e2e tests do not depend on developer infrastructure.
3. Correct stale REST response expectations in existing e2e scaffolds.
4. Add separate e2e commands for `anorcar-api` and `anorcar-batch`.
5. Add GraphQL schema snapshot/contract tests before introducing Car operations.
6. Add migration tests for compatibility aliases and data conversion if those strategies are selected.

## 4. Documentation

1. Reconcile `ANORCAR_AI_PROMPT.md` with actual current filenames and regenerate it if it is intended to remain authoritative.
2. Replace the Nest starter README with ANORCAR setup, architecture, environment, build, test, and deployment instructions.
3. Add the approved Car schema and compatibility timeline to `BACKEND_MIGRATION.md` and `DECISIONS.md`.
4. Update `COMPLETED_TASKS.md` after each focused migration phase.
5. Keep proposed and completed work explicitly separated across all documentation.


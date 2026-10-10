# Architecture Decisions

## Decision record

| Decision | Status | Why | Risks | Alternatives considered |
| --- | --- | --- | --- | --- |
| Perform a branding-only migration first | Completed | Isolates low-risk identity changes from business-domain redesign and makes regressions easier to diagnose. | The ANORCAR name temporarily coexists with Property/Agent terminology. | Perform branding and Car-domain conversion in one breaking release. |
| Rename both Nest application paths and project keys | Completed | Removes active NESTAR workspace identifiers and gives build/deployment artifacts consistent names. | External scripts may still reference old directories. | Keep internal NESTAR identifiers and change only user-facing text. |
| Preserve GraphQL contracts | Completed | Existing clients can continue operating after the rename. | Public API terminology does not yet match a car marketplace. | Immediately replace Property operations with Car operations or add parallel APIs. |
| Preserve MongoDB schemas and collections | Completed | Avoids data loss, migrations, dual writes, and rollback complexity during branding work. | Persisted records remain real-estate-shaped. | Create new `cars` collections or migrate `properties` in place. |
| Keep generic environment keys | Completed | The keys contain no NESTAR branding and changing them would add deployment risk without value. | None specific to branding. | Prefix all keys with `ANORCAR_`. |
| Preserve community modules | Completed | Articles, comments, likes, views, follows, sockets, notices, and notifications are reusable platform capabilities. | Some modules contain Property coupling that must be handled later. | Remove community functionality and rebuild only marketplace inventory. |
| Retain the AI prompt snapshot under ANORCAR branding | Completed | Preserves project context while removing the old project identifier. | The snapshot can drift from the live repository and contains historical structure. | Delete it or regenerate it from current source. |
| Replace Property with Car in one breaking backend release | Completed | The approved ER model is implemented without legacy GraphQL aliases. | Existing Property clients must migrate in coordination. | Temporary aliases or parallel contracts. |
| Keep `MemberType.AGENT` for car ownership | Completed | Preserves the established authorization and member contract. | UI may describe agents as sellers/dealers while the API role remains `AGENT`. | Add or rename to `DEALER`. |
| Use new `cars` and `brands` collections without data conversion | Completed | No production Property data requires migration, and the old collection remains available for manual rollback. | Old records are not visible through the Car API. | In-place conversion or dual collections with backfill. |
| Use a contract-based frontend plan | Current planning default | No Next.js repository is present in this workspace, so concrete paths cannot be verified. | Suggested page/component paths may differ from the real frontend. | Wait for the frontend repository before writing any plan. |
| Record lint debt instead of mass-fixing it | Completed | A branding task should not rewrite unrelated logic and formatting across the codebase. | CI lint remains unavailable or failing. | Install/align lint dependencies and fix all findings in the same change. |

## Guardrails for the next migration

- Treat Car-domain changes as a new project phase, not as unfinished branding work.
- Inventory frontend GraphQL usage before removing or renaming an operation.
- Decide whether compatibility aliases, dual collections, or a coordinated breaking release will be used before implementation.
- Capture data migration and rollback procedures before modifying `properties`, `PROPERTY`, or `AGENT` values.
- Keep tooling cleanup in focused commits so formatting changes do not obscure domain changes.


## 2026-10-10 - Correct canonical Car enum spellings

User explicitly approved correcting backend, frontend and development storage to CarTransmission.AUTOMATIC and CarLocation.DAEJEON. This supersedes earlier instructions to preserve the misspellings AVTOMATIC/DAEJON. No GraphQL legacy aliases were introduced; old enum inputs are rejected. Frontend bookmark filters normalize the two former spellings before sending queries. Existing roles, other enums, resolver/service/module architecture and field names remain. The existing development data was migrated with a snapshot and guarded updates of only the two enum fields; no timestamps or counters changed.

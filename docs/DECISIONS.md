# Architecture Decisions

## 2026-10-13 - Private Firebase customer-to-agent chat

- Add Firebase as a separate backend chat transport; preserve MongoDB member authority, ANORCAR login/signup, shared WebSocket chat and Gemini assistant.
- Firebase UID is the authenticated lowercase member ObjectId. Current ACTIVE USER/AGENT checks are required to mint tokens. USER initiates one deterministic thread per active AGENT; ADMIN has no automatic participant access.
- Trusted backend owns conversation metadata/participants and both indexes. Clients append validated sender-bound messages only. Existing threads use a metadata transaction followed by atomic index fan-out; retry repairs a partially completed creation.
- Fixed 15-minute chat-grant claims bound Firebase access between backend member checks. Immediate revocation on logout/role/status changes requires a later account-lifecycle integration; frontend renewal and Firebase sign-out are deferred.
- Rules deployment is manual after review/emulator validation. No frontend work or automatic rule deployment in this phase. Details: FIREBASE_CHAT.md.

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


## 2026-10-13 - Free text brand names in listing forms

User authorized arbitrary brand-name entry. CarInput/CarUpdate accept optional brandName:String alongside the legacy brandId input; name and ID together are rejected. Authorized AGENT create/update resolves an existing active catalog brand case-insensitively or upserts a canonical uppercase new brand with a generic logo placeholder. Active ownership is checked before resolving a new brand on agent edits. Deleted brands are not reactivated. Existing MongoDB car.brandId, brandData joins, catalog filters, admin brand CRUD and user roles remain unchanged. No schema collection migration or live test listings/brands were created.

## 2026-10-15 - Independent optional vehicle body type and segment

Add CarBodyType and CarSegment through existing enum/DTO/schema/service layers. Body shape, fuel, condition and market segment remain independent: Electric/Hybrid reuse CarFuelType; Luxury uses CarSegment. New fields are nullable to preserve legacy listings without inventing classifications. Existing getCars filters combine bodyTypes and segments with other filters. No backfill, role change or new transport. Frontend agent forms can assign these fields; backend must deploy before frontend selections of the new output fields.
## 2026-10-16 - Admin SOLD car reactivation

User requested reverting accidentally sold listings. Existing admin updateCarByAdmin now permits SOLD -> ACTIVE, clears soldAt/deletedAt and adds one owner memberCars count. ACTIVE -> SOLD/DELETE decrements once; active edits do not change counts. A previous-status condition on the update prevents competing requests from applying the same transition twice. Deleted cars remain non-restorable and permanent removal remains DELETE-only. Existing GraphQL inputs/resolver guards, service architecture and agent-owned update rules are unchanged. No live listing was modified by tests.


## Optional agent metadata and directory filtering - 2026-10-17

The reference agent directory requires real type/language filters. Extend the existing Nestar Member schema/DTO/service and profile form with optional agentType (DEALERSHIP/INDEPENDENT) and agentLanguages (ENGLISH/KOREAN/RUSSIAN/UZBEK/CHINESE/JAPANESE/ARABIC); leave legacy metadata absent rather than guessing or migrating records. Existing agent roles and privileges are unchanged. Type filters use any selected type, language filters require all selected languages, location matches literal stored address text, and active-listing ranges are inclusive. Public queries retain ACTIVE AGENT constraints and existing follow/like lookups. New optional query fields require backend deployment before frontend. No new modules, dependencies or component/styling architecture.

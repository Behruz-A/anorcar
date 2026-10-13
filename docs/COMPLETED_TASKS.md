# Completed Tasks

## 2026-10-13 - Compare navbar heading overlap fix

- Fixed only the sibling frontend Compare route navbar selector: include marketplace-nav in its existing route-scoped override so shared fixed/absolute navbar styles cannot override the intended in-flow navbar. This restores breadcrumb/heading clearance without arbitrary page offsets or changes to other routes.
- Added browser QA assertions for relative navbar positioning and heading bounds below the navbar, including empty selection. Existing Compare browser fixtures passed at 1440/768/390/320px, KR/RU, selection/add/remove/replace/share/reload and empty states. Desktop screenshot visually reviewed; no live GraphQL writes or account/message operations.
- Frontend Yarn typecheck and git diff --check passed. Existing dirty frontend redesign work was preserved. No backend behavior, dependencies, deployment or Git commit changes.

## 2026-10-13 - Firebase preproduction security review

- Verified millisecond chat grants against Rules now, server timestamp resolution/equality, trusted-backend ownership of participants/indexes, append-only sender-bound messaging, JWT/current-member checks and fixed-grant renewal semantics.
- Executed official Database Emulator 4.11.2 locally with portable Java 21 in ignored .tmp; no package dependencies or global installation. The original whitespace regex failed emulator compilation (bundled whitespace automaton serialization issue); replaced it with explicit string whitespace removal while preserving message limits, multiline/Unicode acceptance and authorization gates. Firebase documents the original regex syntax as supported; no claim of a live-production compile failure.
- Expanded emulator coverage to 58 passing tests for authorization, expired/seconds/missing grants, refreshed-token simulation, timestamp resolution, malformed messages, whitespace, sender spoofing, metadata/index tampering, parent PUT/DELETE and root PATCH atomicity. Improved compile-error diagnostics and token unit/lifetime assertions.
- Final 121 tests / 6 suites passed, zero skipped (rules, Firebase, Chat, auth, AI, Inquiry). API/batch TypeScript checks, npm.cmd run build and whitespace checks passed. Emulator stopped after verification; no production Firebase calls, frontend changes, deployment or commit.
- Remaining accepted characteristics: fixed 15-minute grant is independent of JWT remaining lifetime; blocking/logout lacks immediate cross-system revocation. Backend has no production message writer yet; future frontend must use Firebase serverTimestamp. Report: docs/FIREBASE_SECURITY_REVIEW.md.

## 2026-10-13 - Firebase Realtime Database backend chat integration

- Added dedicated FirebaseModule/FirebaseService with named singleton Admin initialization and DI; reused the existing firebase-admin dependency. Startup validates all three Firebase environment settings, HTTPS database root URL, readable service account, matching project and signing credentials with sanitized errors.
- Added separate ChatModule/resolver/service and libs chat DTOs. Existing AuthGuard/AuthMember protect createFirebaseChatToken, createFirebaseConversation and getFirebaseConversation. Firebase UID comes exclusively from the authenticated MongoDB ID; current ACTIVE MongoDB roles/status are checked. USER opens a private conversation with an ACTIVE AGENT; ADMIN has no implicit chat access.
- Transactional deterministic customer/agent thread metadata and atomic two-user index fan-out preserve existing messages/timestamps and repair indexes on retry. Client messages are append-only with server timestamps. Firebase chat grants expire 15 minutes after issuance and require backend renewal; existing grants are not immediately revoked by MongoDB status changes or ANORCAR logout.
- Prepared deny-by-default firebase/database.rules.json and opt-in local emulator security tests/config. Participants/indexes are backend-owned; unauthorized reads, sender spoofing, unexpected fields and message edits/deletes are denied. Rules were NOT deployed. Java/Firebase CLI are absent, so nine emulator rules tests are skipped pending manual execution.
- 63 isolated tests passed across Firebase/chat, auth, AI and Inquiry (26 new backend tests). Both API/batch TypeScript checks and npm.cmd run build passed. Real SDK custom-token signing verified with locally generated fixture credentials; real configured credentials validated locally without Firebase network calls/database writes. Jest's unrelated remote JWKS dependency is mocked for ESM compatibility; real Admin initialization and local signing remain exercised.
- Corrected only ignored .env FIREBASE_SERVICE_ACCOUNT_PATH to the existing ignored secrets JSON filename; no key contents were displayed or modified. Firebase request/response logging is suppressed, including aliases and mixed operations.
- Setup, exact API/storage contract, rules test commands, manual Console configuration and session/index limitations: docs/FIREBASE_CHAT.md. Existing MongoDB models/contracts/login/signup, shared WebSocket chat, Gemini, frontend and dependencies remain unchanged. No deployment or Git commit.

## Recurring frontend blank-page fix — 2026-10-08

- Confirmed dev/build artifact collision in sibling frontend: Cannot find module ./6859.js, page-data 500 and repeated main/react-refresh/_app/index JavaScript 404 responses while root HTML still returned 200.
- Corrected previous QA reports: the temporary wrapper did not apply its intended isolated distDir; builds wrote into .next and could break the running dev server.
- Minimal frontend fix: next.config.js uses .next-dev for development and .next for production; .gitignore includes .next-dev. Existing architecture, object config export, environment keys, redirects and i18n remain.
- Normal Yarn typecheck, lint (0 errors, 194 warnings), migration/auth tests, live GraphQL validation and normal yarn build (88 pages) passed.
- Kept dev running during build and verified original dev JS URLs in 81 rounds, then compared their hashes and reloaded the same browser: files unchanged, rendered homepage/eight cards, no runtime errors or failed requests.
- Normal yarn start served the production build with HTTP 200; production distDir was .next, dev entry was independently in .next-dev. Temporary QA browser/production server closed; dev remains on port 3000, backend on 3007.
- Details and screenshot: sibling anorcar-next/docs/DEV_BUILD_CACHE_FIX.md. Backend source/data, dependencies and lockfiles unchanged; this entry is documentation only.



## Browse by Budget eight-card pagination — 2026-10-08

- User requested eight category cards, desktop pages of six plus the remaining two, and hiding the unavailable direction arrow.
- Rechecked the existing dirty frontend tree and preserved earlier work. Added USD 40K/75K categories, green/silver built-in image_gen photos and two English/Korean/Russian labels.
- Existing Swiper groups six cards on desktop, with trailing spacing synchronized at init/breakpoint/resize so the last page shows only 100K and Any Budget. Mobile retains individual navigation and swipe. Disabled arrows are hidden on both ends.
- Yarn typecheck, lint (zero errors, 194 existing warnings), migration/auth tests, live GraphQL validation and isolated production build (88 pages) passed. Actual browser clicks verified six visible cards, two final cards, right-to-left arrow switching and restoration, all eight inquiries and mobile/localized behavior. Read-only live queries and all eleven translation keys passed.
- Existing folder/layout/MUI/Swiper/SCSS patterns remain. No new architecture, backend code, data, dependency, lockfile or Git commit changes. This backend update is documentation only.
- Exact follow-up decisions and previews: sibling anorcar-next/docs/HOME_BUDGET_UI.md; exact asset prompts: docs/BUDGET_IMAGE_PROMPTS.json.



## Homepage Browse by Budget — 2026-10-08

- Rechecked sibling anorcar-next HEAD f31592c and clean working tree before edits. User approved replacing only homepage Trend Cars with Browse by Budget and explicitly confirmed carPrice is stored in USD.
- Added one homepage component using existing MUI/Next/Swiper patterns, replaced only the desktop/mobile TrendCars mounts, and appended scoped responsive SCSS plus nine English/Korean/Russian translation keys.
- Saved six built-in image_gen automotive category photos in frontend public/img/car/budget. Exact prompts and saved paths are in docs/BUDGET_IMAGE_PROMPTS.json; photos are illustrations, not inventory records or model price claims.
- Five USD ceilings (10K/20K/30K/50K/100K) link to existing /car inquiry pricesRange filters; Any Budget has no price restriction. All use page 1, limit 9, carPrice sort and exact ASC. No new GraphQL operation, currency conversion, Car field or backend source change.
- Final Yarn typecheck, lint (zero errors, 194 existing warnings), migration/auth tests, live GraphQL checks (42 operations, three inline uploads and enums), and production Next build (88 localized pages) passed. Build used a temporary isolated QA output without project configuration changes.
- Additional read-only live queries verified all six inquiries and price order. Current dataset has zero matches for the five ceilings and one match for Any Budget; no data was edited to populate categories.
- Production headless Chrome checks passed for all six actual link clicks, desktop/intermediate widths, 390/320-pixel mobile layouts, real mobile device detection, arrows/touch swipe, localized labels and loaded images. No horizontal overflow or uncaught runtime exceptions were observed.
- Old Trend components remain available; other Home sections, header, Cars UI/forms, comments and auth behavior remain outside this slice. No dependencies, lockfiles, database records or Git commits were changed. Backend change is documentation only.
- Exact changes, decisions, checks and previews: sibling anorcar-next/docs/HOME_BUDGET_UI.md. Further homepage/Cars UI work remains deferred.



## Homepage header screenshot slice — 2026-10-07

- User approved only the navigation, hero and Model Search section of the supplied design after foundation completion.
- Rechecked the current dirty frontend working tree before edits. Preserved Pages Router, existing layout HOC/device branches, homepage component folder, MUI, Apollo and scoped SCSS/i18n patterns.
- Added a small Hero component with opt-in promotional-copy slideshow; rebuilt the homepage HeaderFilter using real GET_BRANDS/GET_CARS data and backend-supported CarsInquiry fields. Homepage Top styles and dark branding match the reference; locale menu selection and scroll-listener cleanup were corrected.
- Total listing count is real. Backend lacks a model catalog/separate model filter, SUV/body category, fuel-economy and certification filters; model suggestions use up to 100 listings/free text and supported Used/New/Electric/Hybrid/price chips replace unsupported suggestions.
- Yarn typecheck, lint (zero errors, 194 warnings), migration/auth tests and live GraphQL validation passed (42 operations, three upload documents and registered enums). Production Next build passed with 88 localized pages using a temporary isolated output directory; project config was unchanged.
- Headless Chrome production checks passed for desktop, 390/320-pixel mobile widths, Korean/Russian and language menu, actual make/year/price and model suggestions, slideshow controls, chip toggles, keyword synchronization and serialized search navigation. No horizontal overflow or uncaught runtime exceptions were observed. Live authenticated visual/mutation workflows are not claimed.
- Generated the hero photo using the built-in image tool and retained the original. Screenshots and exact changes/limitations are documented in sibling anorcar-next/docs/HOME_HEADER_UI.md.
- Existing below-header Home sections, Cars screens/cards/forms, comments and other deferred migration defects were not changed. No backend source, database data, dependencies, lockfiles or Git commits changed; this is a documentation-only update in the backend repository.
- Further Home/Cars UI work remains deferred beyond this explicitly approved header slice.



## Strict frontend foundation migration — 2026-10-07

- Rechecked anorcar-next HEAD a67b9f1 and the current filesystem before edits; the previous uncommitted migration was still present. NESTAR reference HEAD 7466964 remained clean.
- Completed only Phases 0 and 4–8: minimal frontend lint configuration/blockers; Car/Brand/shared type nullability and organization; canonical user/admin GraphQL files; original device detection; JWT/localStorage/Member/error handling; Agents navigation/layout labels and original Basic banner mapping.
- Removed unsupported frontend CommentGroup.COMMENT; exact AVTOMATIC/CHONJU/DAEJON and GraphQL ASC/DESC wire values are preserved.
- After every phase, Yarn typecheck, lint, production build, migration tests and live GraphQL validation passed. Final lint has zero errors and 194 warnings; final build generated 88 localized pages; live validation covers 42 operations, three inline upload documents and registered enums.
- Isolated auth regression checks passed. Read-only HTTP checks passed for seven routes, three locale/query-preserving 308 redirects and four banner assets. Browser runtime had no available browser; interactive QA and live authenticated mutation/upload workflows are not claimed.
- Backend source findings remain unchanged: nested availableMemberSorts validation; Member role/status fields exposed by signup/update; comment deletion counter behavior; no connected new notification/notice operations.
- Home/Cars UI parity is NOT complete. Existing hero/mobile/filter/card/form/SavedCars/SCSS departures and remaining screen Seller copy are deferred. No Home/Cars UI implementation was performed beyond mechanical GraphQL/type imports; Home layout only received a lint display name.
- No backend business code, database records, dependencies, lockfiles or Git commits were changed. This entry updates documentation only.
- Full exact-change/check/deviation/deferred-defect report: sibling anorcar-next/docs/FOUNDATION_MIGRATION.md. This supersedes the earlier frontend integration entry as the current approved migration status.
- STOP: wait for explicit user approval before Home/Cars UI migration.


## ANORCAR frontend integration (2026-10-07; supersedes the 2026-10-06 report)

- Integrated sibling anorcar-next canonical Car/Brand contracts, homepage/search/cards/details, seller forms/uploads, inventory, favorites/visits, and admin screens; active Property contracts and replaced components are retired.
- Preserved Next.js Pages Router/Apollo/MUI/SCSS, auth/member/community/follows/chat, USER/AGENT/ADMIN roles, and backend AVTOMATIC wire value. Ownership remains AGENT-only.
- Connected memberCars/CAR engagement, authentication hydration, active Brand selection, owner ACTIVE-to-SOLD/DELETE actions, confirmed permanent DELETE removal, and Brand soft-deletion/reactivation.
- Applied ANORCAR branding, English/Korean/Russian localization, and responsive core browse/detail/account navigation/create/edit/inventory/favorites/visits screens. Interactive mobile acceptance is not yet verified.
- Final yarn typecheck, yarn test:migration (42 operations and contract/helper/localization checks), and yarn build passed; production build generated 88 localized pages.
- Read-only production HTTP smoke checks passed: 13 page/asset responses returned 200; three permanent redirects returned 308 preserving locale and query parameters.
- Final yarn check:graphql failed to connect to localhost:3007/graphql. Live schema compatibility, role permissions, uploads, mutations, counters, and regression workflows remain release prerequisites.
- Interactive desktop/mobile browser QA was unavailable: the in-app browser runtime returned no browser. Unrelated mobile support/community placeholders and dormant legacy media remain follow-up work.
- Frontend details and remaining acceptance checklist: anorcar-next/docs/FRONTEND_MIGRATION.md. Backend documentation is in docs, not the absent docs/ai directory.
- No dependency upgrades, backend business-code changes, database/data mutations, or Git commits were performed. This is integrated implementation, not a release-acceptance claim.

## Property-to-Car backend migration

- Replaced the Property GraphQL and Mongoose domain with the breaking Car contract backed by `cars`.
- Added the Brand schema and public/admin Brand operations backed by `brands`.
- Added fuel, condition, transmission, location, year, model, color, brand, price, image, lifecycle, and engagement fields and filters.
- Preserved `MemberType.USER`, `MemberType.AGENT`, and `MemberType.ADMIN`; renamed only the inventory counter to `memberCars`.
- Migrated likes, views, comments, notifications, favorites, visits, and batch ranking from `PROPERTY` to `CAR`.
- Added focused Car input/filter, Brand lifecycle, and batch ranking tests.
- Left the inactive `properties` collection untouched; no data migration or compatibility aliases were added.

## Branding and workspace refactor

- Renamed `apps/nestar-api` to `apps/anorcar-api`.
- Renamed `apps/nestar-batch` to `apps/anorcar-batch`.
- Changed the package and lockfile project name from `nestar` to `anorcar`.
- Updated Nest source roots, project keys, TypeScript configuration paths, and build output paths.
- Updated development and production scripts to use the ANORCAR application identifiers.
- Updated cross-application imports and absolute API guard imports to the new paths.
- Renamed the batch module class to `AnorcarBatchModule` and updated its bootstrap and e2e references.
- Changed the API welcome text to ANORCAR branding.
- Renamed `NESTAR_AI_PROMPT.md` to `ANORCAR_AI_PROMPT.md` and replaced legacy branding/path references.
- Corrected the stale API e2e config path and incompatible `supertest` test imports.

## Compatibility preserved during the branding-only refactor (historical)

- No GraphQL operation, type, field, enum, argument, or response shape was changed.
- No MongoDB schema, model, collection, index, or document field was changed.
- Property, member, article, comment, like, view, follow, socket, auth, upload, notification, and batch business behavior remained unchanged.
- Generic environment keys and values remained unchanged.
- No Property-to-Car or Agent-to-Dealer domain migration was performed.

## Principal affected areas

| Area | Change type |
| --- | --- |
| `package.json` and `package-lock.json` | Package metadata and command paths |
| `nest-cli.json` | Nest project identifiers and application roots |
| API/batch application directories | Filesystem rename |
| Application `tsconfig.app.json` files | Build output paths |
| Batch bootstrap/module/service | Path and branding-symbol updates |
| API welcome service and guard imports | Branding/path updates |
| E2E scaffolds | Renamed module/path and type-compatible imports |
| AI prompt snapshot | Artifact filename, branding, and path references |

## Validation status

| Check | Result | Notes |
| --- | --- | --- |
| Legacy NESTAR search | Passed | No active case-insensitive `nestar` references remained outside ignored dependency/build metadata. |
| TypeScript typecheck | Passed | `tsc --noEmit` completed successfully after test import corrections. |
| API build | Passed | `anorcar-api` compiled successfully. |
| Batch build | Passed | `anorcar-batch` compiled successfully. |
| Mongo schema integrity | Passed | Schema files were byte-identical to their pre-rename Git blobs. |
| Unaffected moved-file integrity | Passed | Non-branding moved files were byte-identical. |
| Diff whitespace check | Passed | `git diff --check` reported no errors. |
| Jest suite | No runnable standalone suite discovered | Only e2e scaffolds are present and they require application infrastructure. |
| ESLint | Blocked / existing debt | The configured `typescript-eslint` package is absent. A temporary compatible run exposed 290 pre-existing findings; no mass rewrite was performed. |



## 2026-10-08 — Budget slider clarification
Frontend desktop now shows cards 1–6 then 3–8, always six visible, using existing Swiper with a two-card step and no trailing offset. Card 6/8 image references swapped; filters and backend code unchanged. Typecheck, lint (194 existing warnings, zero errors), migration/auth tests, live GraphQL and eight budget contracts, production build (88 pages), actual browser navigation, image references, mobile swipe and locales passed. See anorcar-next/docs/HOME_BUDGET_UI.md and updated screenshots.


## 2026-10-08 — Trending Cars frontend UI
Existing TrendCars/TrendCarCard now mounted after Budget with four-across desktop cards and View All instead of pagination. Preserved GET_CARS, carLikes DESC/limit 8, Apollo onCompleted/useState, LIKE_TARGET_CAR and same-input refetch/userVar/SweetAlert. Added local eligibility carLikes >= 1 AND carViews >= 2 because backend CarSearch has no engagement filters. View All is existing like-sorted Cars listing, not server-filtered trending. Unsupported mileage omitted in favor of transmission; USD retained. Backend code unchanged. Typecheck, lint (190 existing warnings, no errors), migration/auth tests, live 42-operation GraphQL contract check and 88-page production build pass. Isolated browser verified real empty state and browser-only fixtures for thresholds, desktop/mobile UI, View All/detail clicks, guest like, swipe, locales, empty/error states without runtime exceptions or database writes. See anorcar-next/docs/HOME_TRENDING_UI.md and explicitly fixture-only previews.


## 2026-10-08 — Trending height and authorized demo inventory
User requested three actual demo listings and Popular-sized Trending section. Desktop min-height 816px/padding 132px 94px, responsive mobile retained. Existing APIs created one demo AGENT, two USER viewers, three Hyundai demo cars (Elantra/Tucson/Sonata), and real per-user view/like records giving each 1 like/2 views. Existing inventory and backend source unchanged. Hide missing optional Hyundai logo in Trending only. Typecheck, lint (190 existing warnings), migration/auth tests, live GraphQL, 88-page build and live browser desktop/mobile checks pass; measured Trending and Popular both 816px, three real cards visible. Full car IDs, roles and screenshots recorded in anorcar-next/docs/HOME_TRENDING_UI.md; credentials excluded.


## Fourth demo car — 2026-10-08
User requested one more card. Added Demo Hyundai Santa Fe (ID 6ac73a83e8ca66a84a682deb), 2024, USD 36500, HYBRID, USED, exact DAEJON/AVTOMATIC, existing green illustrative artwork. Reused demo AGENT and two USER accounts through existing GraphQL APIs; new car has 1 like and 2 distinct authenticated views. No new accounts or frontend/backend source changes in this follow-up. Public like-sorted query and live localhost:3000 browser confirm four eligible cards, matching 816px Trending/Popular heights and responsive mobile without runtime exceptions. Existing Sonata now has 2 likes; this follow-up did not modify its engagement. Updated live screenshots.


## Popular typography alignment — 2026-10-08
Trending Cars and Browse by Budget headings match existing Popular Cars desktop typography exactly: Poppins, 34px, weight 500, 150% line height, -0.646px letter spacing, #181a20. Added existing translated Trend is based on likes subtitle under Trending, matching Popular subtitle typography. Responsive 25px mobile headings retained. Existing GraphQL carLikes DESC ordering, >=1 like AND >=2 views eligibility, Budget filters and arrow behavior unchanged; no data writes or backend source changes. Typecheck, lint (190 existing warnings/no errors), migration/auth tests, live GraphQL and 88-page build passed. Real browser compared computed typography for all three headings, verified like subtitle and descending real counts, four cards, 816px desktop height, responsive mobile and no exceptions. Updated live Trending screenshots.


## 2026-10-08 — Top Agents dark homepage section
Updated existing TopAgents/TopAgentCard and moved existing mount directly after Trending in both device branches. Dark reference UI, five-across portrait cards, View all agents CTA, real profile links. Preserved GET_AGENTS/Apollo/useState/onCompleted/memberRank DESC/page 1/limit 10 and AGENT roles; equal-rank ties use updatedAt DESC within fetched page. Five authorized fictional demo AGENT profiles created through signup/updateMember; built-in image_gen portraits uploaded through existing imageUploader API, with originals in frontend public/img/agents/demo. No backend source, existing inventory/counters, schema or dependency changes. Certification wording omitted because contract has no certification flag. Typecheck, lint (189 existing warnings/no errors), migration/auth tests, live GraphQL, 88-page build, actual desktop/mobile/locale/profile/CTA/swipe browser tests and empty/error fixtures passed with no exceptions. Full IDs, assets, exact prompts and screenshots: anorcar-next/docs/HOME_AGENTS_UI.md and AGENT_IMAGE_PROMPTS.json. Credentials excluded. localhost:3000 remains running; no commit/deploy.


## 2026-10-08 — Ten-agent 5+5 navigation and taller section
Existing TopAgents now matches 816px desktop Trending/Popular height and uses existing Swiper Navigation/MUI buttons in Budget pattern. Five agents per desktop view, right-only initially, left-only at end, mobile arrows/touch retained. GET_AGENTS still page 1/limit 10/memberRank DESC with existing tie-break. Initial total seven: added only three authorized demo AGENT profiles (Jisoo Han, Alex Choi, Eunwoo Lim) with built-in generated portraits via normal signup/updateMember/imageUploader APIs; exact total ten confirmed. Existing accounts/data/counters/ranks unchanged; two existing no-photo accounts retain default avatars. Typecheck, lint (189 existing warnings/no errors), migration/auth tests, live GraphQL, 88-page build and live 5+5/arrow/mobile/routes/locale/empty/error checks passed without exceptions. Backend code and architecture unchanged. Full IDs/prompts/assets/checks/screenshots in anorcar-next/docs/HOME_AGENTS_UI.md and AGENT_IMAGE_PROMPTS.json. No commit/deploy.


## 2026-10-08 — Recently Added Cars homepage section
New section mounted immediately after Top Agents in both device branches, with existing GET_CARS/Apollo/useQuery/cache-and-network/onCompleted state pattern. Backend sorts ACTIVE listings by createdAt DESC, page 1/limit 8; View All opens existing Cars page with same sort/page 1/limit 9. Reference-inspired four-column desktop/two-column tablet/one-column mobile cards, standardized Poppins heading, EN/KR/RU, USD prices and real detail links. No mileage contract exists: omitted reference kilometers. Five real ACTIVE listings currently available; no demo listings/data writes this task. Missing legacy test-car.jpg uses existing placeholder only in new card. Backend source/contracts/dependencies/auth and other sections untouched. Typecheck, lint (189 existing warnings/no errors), migration/auth checks, 42-operation live GraphQL plus inline uploads/enums, 88-page build, diff and actual browser order/typography/CTA/links/images/locales/mobile tests pass. Screenshots and details: anorcar-next/docs/HOME_RECENT_CARS_UI.md. Dev localhost:3000 running; no commit/deploy.

## 2026-10-08 — Ten additional authorized demo cars
Added exactly ten fictional Hyundai demo listings through existing createCar API under existing demo AGENT; existing two demo USER accounts supplied one like and two distinct authenticated views per new car. Inventory increased from five to fifteen ACTIVE listings; owner memberCars now fourteen. Existing records/accounts/engagement, frontend/backend source, contracts and architecture untouched. USD and exact AVTOMATIC/CHONJU/DAEJON enums retained. Existing illustrative Budget images reused and descriptions explicitly identify fictional demo inventory/artwork. Yarn typecheck and 42-operation live GraphQL/upload/enum check passed. Real browser confirms Recently Added eight newest cards (createdAt DESC), responsive 4/2/1 layout, CTA/detail links, images, locales and mobile without errors. Homepage counts: Trending 8, Popular 7, Top 8; existing limits unchanged. IDs and public summary in anorcar-next/docs/DEMO_CARS_ADDITIONAL_10.md; updated recent screenshots. Credentials remain outside repos. No commit/deploy.

## 2026-10-08 — Homepage Community Board Highlights
Replaced existing homepage CommunityBoards/CommunityCard presentation in place and mounted the responsive section in the mobile branch. Reference-inspired large-left/two-small-right/wide-bottom grid, MUI category tabs, View All Posts, standardized typography, 13px metadata, EN/KR/RU, image fallback and hover. Preserved existing GET_BOARD_ARTICLES/useQuery/network-only/onCompleted state pattern and articleViews DESC; active-category query page 1/limit 4 replaces simultaneous NEWS/FREE previews. Backend categories NEWS/FREE/RECOMMEND/HUMOR retained with honest labels; unsupported Car Tips/Reviews were not invented. CTA/detail category routes retained. Public API currently has zero posts in every category: live empty state is correct. No post seeding or database writes. Typecheck, lint (182 existing warnings/no errors), migration/auth checks, live GraphQL (42 operations plus three inline uploads/enums), 88-page build and browser category/query/navigation/grid/typography/locales/mobile/empty/error/loading tests pass. Preview screenshots explicitly use browser-only fixtures, not real posts. Docs: anorcar-next/docs/HOME_COMMUNITY_UI.md. Backend source/contracts/auth/comments/dependencies and unrelated screens unchanged. Dev localhost:3000 remains running; no commit/deploy.

## 2026-10-08 — Taller Community section and authorized demo articles
Desktop Community min-height now 1000px/padding 132px 94px, grid rows 280px and featured card 578px; responsive content sizing and four 260px mobile cards retained. Created exactly sixteen fictional demo BoardArticles (four per NEWS/FREE/RECOMMEND/HUMOR) through normal createBoardArticle using existing demo USER; eight existing illustrative assets uploaded through imageUploader(target: article). No new accounts, fabricated counters, frontend architecture/query/route changes or backend source/schema edits. Typecheck, live GraphQL 42 operations plus inline uploads/enums, 88-page build and real browser API/DOM order/category/images/desktop/mobile tests pass, all uploaded images HTTP200. Full IDs and live screenshots recorded in anorcar-next/docs/HOME_COMMUNITY_UI.md. Prior empty-state report is historical. Credentials excluded, no commit/deploy; dev localhost:3000 remains running.
## 2026-10-08 — Shared footer reference UI
Updated existing shared Footer and scoped main.scss styles with dark responsive reference layout, exact header SVG artwork with white lettering, newsletter/columns/contact/social/app presentation and EN/KR/RU labels. Subscribe intentionally has no handler, form submission, navigation or API call. Back-to-top is placed in footer lower-right, uses the same red as Subscribe and honors reduced motion. Existing available routes are retained; New/Used Cars use real NEW/USED conditions and DESC, Featured uses carRank DESC. Unsupported destinations and app/social URLs remain static rather than invented. Architecture/Apollo/layout mounts, chat, backend code/data and dependencies unchanged. Yarn typecheck, lint (180 existing warnings/zero errors), migration/auth tests, live GraphQL 42 operations/three uploads/enums, 88-page build and real desktop/mobile/locale/Subscribe/scroll/route tests passed without overflow or exceptions. Details and screenshots: anorcar-next/docs/HOME_FOOTER_UI.md. No commit/deploy; localhost:3000 dev server running.
## 2026-10-08 — ANORCAR six-event carousel
Replaced existing static tourism Events UI in place with automotive portrait carousel, warm light background, centered standard Poppins heading, six dots/arrows, partial edge cards, photo hover and EN/KR/RU. Same existing EventCard/MUI/Swiper/Next Image patterns; same desktop order and responsive Events now mounted in mobile branch. Backend has no Event contract: user explicitly approved six static demo events sorted by fictional createdAt DESC, limit six; backend integration deferred. UI identifies concepts rather than confirmed dates/locations. Five built-in image_gen illustrative assets saved in public/img/events; sixth reuses existing hero. No backend code/data/contracts, dependency, auth or unrelated section changes. Typecheck, lint (180 existing warnings/no errors), migration/auth, 42-operation live GraphQL/three uploads/enums, 88-page build, diff and real desktop/mobile/locale/navigation/image tests passed. At 1690px three full plus two partial cards; sixth reached via controls. Details, exact prompts and screenshots: anorcar-next/docs/HOME_EVENTS_UI.md and EVENT_IMAGE_PROMPTS.json. No commit/deploy; localhost:3000 remains running.
## 2026-10-08 — Frontend logo reference update

- Read frontend AGENTS.md and backend migration/completed/decisions/next-step documentation. The referenced docs/ai directory is absent; current documents are in anorcar/docs.
- Redrew the supplied curved orange ANORCAR mark as SVG and replaced all seven existing logo assets. Light backgrounds use dark lettering; existing dark header/footer backgrounds use white lettering. Community and favicon use the same mark without the wordmark.
- Corrected login/admin wordmark sizing and removed duplicated login brand text. Favicon now references the dedicated mark asset.
- Yarn typecheck and git diff --check passed. Headless Chrome screenshot visually confirmed the live desktop homepage; a narrow viewport confirmed the logo remains legible. Light/dark/icon variants were separately rendered and visually inspected. Full mobile layout/navigation and authenticated admin workflows were not tested in this logo-only change.
- Frontend previews: docs/screenshots/logo-home-desktop.png, logo-home-mobile.png and logo-variants.png. Preserved existing unrelated working-tree changes. No GraphQL/backend source/data, dependencies or lockfiles changed.


## 2026-10-09 - Homepage Compare Cars and optional kilometre mileage

- Replaced only the Popular Cars mounts in both sibling anorcar-next homepage device branches with a three-car comparison section. Earlier Events/Top Cars/video removals are preserved. Existing Pages Router/layout/Apollo/MUI/SCSS patterns and Car/Brand enums/types remain.
- Two real view-sorted active listings initialize the shortlist. Paginated picker supports literal model/title search and real Brand filters. Duplicate IDs and additions past three are blocked; Compare requires two. In-section result table shows twelve supported fields, differences-only filtering, remove/edit/clear actions and detail URL targets. Responsive stacked mobile cards and horizontal table, EN/KR/RU, existing Poppins heading standard and ANORCAR accent.
- User explicitly approved adding mileage to backend storage in whole kilometres. Added nullable carMileage to existing Car output/create/update DTOs and Mongo model with nonnegative Int-range validation. No new enum, resolver/service/module, unrelated domain field, default or backfill. Frontend adds only a CarMileage domain alias, existing Car query selections and optional create/edit form field. Unknown readings stay unknown; zero is preserved.
- Frontend Yarn typechecks after phases, migration/auth tests, compare invariants, live 42-operation GraphQL/three-upload/enum validation, lint (no errors; existing warnings) and final 88-page production build passed. Backend API/batch typechecks, API build and two focused CarInput/mileage suites passed: 25 tests, including DTO boundaries and Mongo model values.
- Read-only standalone headless Chrome verified real inventory at 1440px desktop and 390px with mobile user agent: initial selection, empty search/reset, duplicate prevention, three-car limit, comparison/differences, detail href targets, removal and clearing. Actual EN/KR/RU headings/counts verified; no uncaught exceptions. Four final screenshots visually reviewed. Connected Browser runtime was unavailable; a separate temporary Chrome profile was used.
- Corrected stale development locale caching with dev-only reloadOnPrerender; production caching unchanged. No fabricated engine/body/efficiency/safety specifications, no database records/seeding, no dependencies/lockfiles, no live authenticated mileage save, no deployment or commit. Model/DTO mileage persistence behavior is unit-tested without database writes.
- Full implementation/limits/checks/previews: sibling anorcar-next/docs/HOME_COMPARE_UI.md. Preserved prior uncommitted backend documentation. Current handoff docs remain in docs, not the absent docs/ai directory.


## 2026-10-09 - Compare selection reference follow-up

- User supplied a new reference for the upper comparison section and selection modal. This supersedes the earlier initial auto-selection: homepage now starts with three empty sedan silhouettes, numbered Add Car 1/2 actions, a smaller optional third slot and a centered Compare button requiring two selections.
- Slot-specific state preserves positions, including third-slot-first selection and holes after removal. Single-click Select Brand/Model modal rows populate only the clicked slot and close immediately. Existing Car/Brand queries paginate real listings; brand-name fragments use existing brandIds and other terms use escaped model/title search. Duplicate/occupied-slot/fourth-slot guards remain. Existing comparison table, types/enums, mileage storage and detail routes are preserved.
- Updated scoped styles, a small code-native SVG silhouette and EN/KR/RU labels. Existing Pages Router/layout/Apollo/MUI architecture remains; no backend source/contracts/data, dependency or lockfile changes in this follow-up.
- Yarn typecheck, compare invariant tests, final production build (88 pages, lint without errors) and real-inventory headless Chrome desktop/mobile/localized QA passed. Verified initially empty/disabled state, third-slot-first, one-click modal closure, two-car enablement, brand/literal punctuation/empty searches, duplicate prevention, comparison/differences/details hrefs/remove/clear and actual translated headings/modal titles/counts with no uncaught exceptions. Refreshed dev configuration watcher to load new locale keys.
- Updated seven previews and exact report in sibling anorcar-next/docs/HOME_COMPARE_UI.md. Empty desktop/mobile and picker screenshots visually reviewed against the reference. No commit or deploy.


## 2026-10-09 - Exact comparison selector and standalone result page

- Applied the user's latest reference: rectangular empty slots, spoke-wheel sedan silhouette, smaller optional third card, reference typography/spacing and centered disabled Compare Cars. Removed counts, progress dots, explanatory copy and button icons. Hover uses ANORCAR orange with white text and Add Car to Compare tooltip.
- Picker is a rectangular Select Brand/Model dialog with plain search and brand/model names only. Removed year/price/add icons/striping/count/pagination. Empty search shows actual recent searched listings, bounded to 20 under a dedicated browser key; first use with no history prompts for a search. Existing Car/Brand queries and escaped literal text search are retained.
- Compare navigates to sibling frontend /car/compare?ids=... with existing navbar, comparison section and footer only. Reused LayoutFull with an optional showChat flag preserving other routes. Validated/deduplicated/capped URL IDs, existing GET_CAR loading, refresh persistence, missing-car retry and removal handling. Preserved supported comparison fields, existing types/enums and authorized mileage behavior.
- Yarn typecheck, compare invariant checks and production build (91 localized pages; no lint errors) passed. Real-inventory isolated headless Chrome desktop/mobile and EN/KR/RU QA passed, including exact typography, orange/white hover, recent history, duplicate prevention, standalone navigation/refresh, differences/detail links/removal and no uncaught exceptions. Screenshots and current behavior documented in sibling anorcar-next/docs/HOME_COMPARE_UI.md.
- No backend source/contract/data changes in this follow-up; no dependencies, lockfile changes, commit or deployment. Existing uncommitted documentation preserved.

## 2026-10-09 - Comparison selector viewport fit

- Kept the maximum of three cars. Bounded the comparison section to its parent and centered its container with a 1360px maximum. Selected homepage cards now have photos capped at 180px, tighter content/spec spacing and stable year badges; table cards remain unchanged. Enabled Compare text is white.
- Yarn typecheck and isolated real-inventory browser QA passed at 390px mobile, 1440px desktop and 2796px wide desktop, plus KR/RU. Added assertions that every selection slot stays inside the viewport, the heading is not clipped and selected photo height stays bounded. Existing route, refresh, search, duplicate, differences and removal checks also passed. Wide-screen screenshot visually reviewed.

## 2026-10-09 - Comparison card image and slot alignment

- Fixed the selected-photo aspect-ratio/max-height interaction that narrowed the photo box: photos now have explicit equal horizontal insets, full available width and a fixed 180px height, with centered cover sizing. Removed grey letterboxing.
- Added a selected-state grid class so empty slots stretch to the selected cards on desktop while the initial empty reference layout remains. Reduced only the gap before the following Community section. Existing selection and result logic remains.
- Yarn typecheck and real-inventory isolated browser QA passed at 390px, 1440px and 2796px, including EN/KR/RU flows. Added checks for equal photo insets and equal desktop slot heights. Reviewed the updated selected-card screenshot.

## 2026-10-09 - Standalone comparison page heading

- Added Home / Cars / Compare breadcrumbs with localized Next links, semantic H1 Compare Cars and the requested introductory sentence above the comparison table. Scoped to the standalone result page; homepage selector is unchanged.
- Matched existing Poppins typography: desktop title 34px/500/150% with -.646px tracking, mobile title 25px, muted 14px/24px body and 12px breadcrumbs. Added EN/KR/RU labels and an accessible current-page marker. Added scroll margin for the fixed navbar.
- Yarn typecheck and real-inventory desktop/mobile/localized browser QA passed, including heading, introduction, Poppins font and localized breadcrumb targets. Existing comparison behavior remains.

## 2026-10-09 - Homepage comparison heading consistency

- Replaced the homepage comparison heading Arial override with the same Poppins 34px/500/150% typography and tracking used by other homepage sections; mobile uses 25px. Added the concise introduction: Compare up to three cars, side by side. EN/KR/RU translations are included.
- Yarn typecheck and focused browser heading checks passed on desktop/mobile and all three locales. Desktop screenshot visually reviewed. Restarted the stopped dev server and rebuilt its stale cache; old cache retained in TEMP. No comparison logic or backend source changes.

## 2026-10-09 - Premium homepage comparison and guarded session restoration

- Implemented the approved homepage comparison header, three equal desktop cards, responsive tablet/mobile layouts, real listing details, selection counter, Clear All and atomic replacement. Kept USD units/formatting, existing mileage/types/enums and the existing /car/compare route and results-table presentation.
- Upgraded the existing picker to fresh GET_CARS listings with thumbnails, Select controls, debounced escaped search and nine listings per server page. Excluded selected IDs only from displayed choices; server totals/page counts remain unchanged.
- Added session slot-ID persistence, restoration skeletons, per-slot revisions and generation guards, complete Apollo-cache reuse, per-client request deduplication, unavailable-listing removal and network retry. Late responses cannot undo newer selection or Clear All. Storage errors leave the UI usable in memory.
- Yarn typechecks, focused comparison/restoration tests and production build passed (91 localized pages). Isolated real-inventory browser QA passed at 390/768/1440/2796px and EN/KR/RU, including atomic replacement/cancellation, unchanged totals, existing results navigation, refresh, cache-only Back restoration and delayed-response Clear All protection.
- Backend limitation remains explicit: uncached GET_CAR restoration can record a new authenticated view. GET_CARS has no arbitrary-ID filter, so guaranteed fresh view-free restoration requires separate backend support. Cached selections are snapshots; the existing results page checks fresh availability. No backend schema/source changes or dependencies were introduced.
- Current implementation, modified-file inventory, previews and limitations are documented in anorcar-next/docs/HOME_COMPARE_UI.md. Existing unrelated uncommitted changes were preserved. No commit or deployment.
- Final accessibility follow-up: fixed MUI transition stealing search autofocus and removed a duplicate dialog title ID. Yarn typecheck and focused browser checks passed with sessionStorage reads/writes blocked, Enter activation, search autofocus, dialog focus containment, Escape cancellation/focus return and all three selections.

## 2026-10-09 - Comparison results navbar and readability review

- Scoped /car/compare to an opaque in-flow sticky navbar, with measured navbar height for scroll margins and tablet wrapping. Removed the results route's fixed page offset; homepage and other layouts retain their behavior.
- Preserved twelve fields, actual images, names, USD prices, differences filtering, remove and detail links. Refined typography/cell spacing and three-car horizontal sizing. Missing mileage renders as an em dash only in results; valid zero remains 0 km.
- Yarn typecheck, existing comparison tests and focused rendered two/three-car table tests passed. Real-inventory browser checks passed on desktop/tablet/mobile and EN/KR/RU, including scrolling/stacking, aligned rows, three-to-two removal and correct details navigation. Measured scroll clearance passed; screenshots visually reviewed.
- No GraphQL contract changes, dependencies or homepage UI changes. Unrelated uncommitted edits preserved. Review details: anorcar-next/docs/COMPARE_RESULTS_REVIEW.md.

## 2026-10-10 - Cars browse reference UI

- Implemented the supplied Cars page content reference in sibling anorcar-next while preserving navbar, hero/banner, footer, Pages Router/layout HOC, MUI, Apollo, existing Car types/enums and URL inquiry behavior.
- Added scoped sidebar filters, real Brand/model suggestions, breadcrumbs, existing Poppins typography, actual inventory count, sorting, grid/list controls, real brand strip, responsive cards, photo counts, supported mileage/USD pricing, existing favorites mutation/refetch and server pagination. Added EN/KR/RU translations and loading/empty/retry states.
- Model suggestions use up to 100 actual selected-brand listings and the existing text search because the backend has no dedicated model catalog/filter. Actual backend location enums and nine-listing default page size are preserved; missing mileage is omitted.
- Replaced the legacy listing SCSS import with the new scoped browse stylesheet and fixed initial listing hydration/translation mismatches. Resolved duplicate same-workspace Next dev processes; one dev server is running on port 3000.
- Yarn typechecks, migration/auth/translation checks, lint (warnings, no errors) and final production build (91 localized pages) passed. Read-only real-inventory Chrome QA passed at 320/390/768/1024/1440px, including bounds, Poppins, USD, grid/list, real model selection, brand/location/reset URL filters, server pagination, EN/KR/RU and no uncaught exceptions. Desktop/mobile/list screenshots were visually reviewed.
- Report: anorcar-next/docs/CARS_BROWSE_UI.md. No backend source/schema/data changes, dependencies, lockfiles, commit or deployment. Authenticated favorite persistence was not exercised; existing behavior is retained.

## 2026-10-10 - Approved Cars listing refinement

- Refined only sibling anorcar-next /car content and browse-specific cards: compact sidebar controls, independent validated year/USD price drafts, aligned cards, responsive sorting/brand chips, pagination scroll, loading/updating/empty/retry states and existing MUI mobile filter drawer with focus/Escape/draft handling.
- Verified backend inclusive range behavior with source inspection and read-only live GraphQL queries. Complete required start/end structures remain unchanged; blank UI bounds use existing supported limits on apply. No backend source, schemas or records changed.
- Model and keyword retain shared search.text. Explicit model selection replaces the keyword; brand changes and sorting retain drafts. Existing URL text is preserved until edited; edited keyword metacharacters are escaped. URL refresh, Back/Forward, sorting and pagination are preserved. Clear Filters also clears unapplied drafts for unavailable URL brands.
- Preserved existing NESTAR/Pages Router/MUI/Apollo architecture, Poppins, EN/KR/RU and USD. The non-browse CarCard render branch matches the initial snapshot. Navbar, hero, homepage, footer, existing images and demo records were not modified; unrelated dirty work was retained.
- Phase typechecks, final lint (warnings/no errors), production build (91 localized pages), migration/auth/localization checks, comparison/restoration checks, helper/live range regressions and full isolated browser QA passed. Browser coverage includes 320/390/768/1024/1440px, grid/list, filters/models, ranges, drafts, refresh/history, pagination scroll, empty/Clear Filters, delayed loading, browser-only outage/retry, drawer focus/Escape and all locales. Early localhost request/interception harness failures were resolved in the QA profile; app transport is unchanged.
- Report and modified-file inventory: anorcar-next/docs/CARS_BROWSE_UI.md. Screenshots reviewed. Model suggestions remain limited to up to 100 selected-brand listings; authenticated favorite persistence was not exercised to avoid record changes. No dependencies, commit or deployment.

## 2026-10-10 - Cars listing spacing and model helper follow-up

- Made the model helper conditional on an existing keyword and available model choices, with shorter EN/KR/RU copy; filtering logic is unchanged. Reduced browse title/location margin from 7px to 3px and sidebar/drawer Apply/Reset gap from 16px to 8px. Equal card heights and other card usages are preserved.
- Yarn typecheck, lint (existing warnings/no errors), production build (91 pages), full responsive/localized browser regressions and whitespace checks passed. Refreshed browse screenshots and reviewed the desktop preview. Resolved duplicate same-project dev servers sharing a cache; one healthy dev server remains on port 3000.
- Changes are limited to browse fields/styles, localized labels and documentation/previews. No backend source/contracts/data changes, dependencies, commit or deployment.

## 2026-10-10 - Cars hero4 banner

- Updated only the Cars /car hero in sibling anorcar-next to use the user-provided public/img/hero4.png. Added concise copy: Find your next car / Your next journey starts here, with EN/KR/RU translations.
- Preserved the existing Basic layout, desktop navbar and 557px hero height, Apollo/GraphQL and listing behavior. Added the Cars hero to the existing mobile branch with a 360px height, responsive image crop and readable left-aligned white copy over a restrained overlay.
- Yarn typecheck and git diff --check passed. Read-only isolated Chrome checks passed at 320/390/768/1440px and EN/KR/RU, including image load, translated copy, hero height, viewport bounds and no uncaught exceptions. Desktop/mobile screenshots were visually reviewed and saved in anorcar-next/docs/screenshots/cars-hero-1440.png and cars-hero-390.png. Refreshed dev page cache for edited translation resources.
- Backend docs are in docs, not the absent docs/ai directory. No backend source, contracts, data, dependencies, commit or deployment changes.

## 2026-10-10 - Cars navbar alignment and spacing

- Scoped the Cars navbar to its existing hero/content container, dark translucent background, active Cars underline, aligned account controls and responsive tablet/mobile rows. Preserved routes, authentication, locale switching and existing notification rendering; added keyboard access to the existing account menu and local/default profile-image handling. Hero4 image, current Find Your Next Car copy, hero height and listing sections remain unchanged.
- Final user-requested spacing refinement changes only two navbar CSS declarations: explicit flex: 1 and justify-content: space-evenly for center links. Existing responsive overrides remain intact.
- Yarn typecheck and whitespace checks passed. Isolated read-only browser checks covered 320/390/768/1024/1440/1920px and EN/KR/RU, container alignment, bounds, no overlap, current-page link, language-menu positioning and scroll background. Local browser account fixtures verified grouped avatar/notification/language controls and keyboard profile menu; fixture Authorization was stripped before public API requests. No account/data writes occurred.
- One repeated Russian mobile navigation timed out waiting for live inventory; its fresh-session retry passed. Account fixture checks passed through desktop/mobile and Russian mobile with no uncaught exceptions. Screenshots in sibling frontend docs/screenshots/cars-navbar*.png were reviewed. No backend logic, dependencies, commit or deployment changes.

## 2026-10-10 - Homepage hero5 image and concise copy

- Updated the existing homepage Hero to the user-provided public/img/hero5.png, with readable white copy and a restrained dark overlay. Initial headline: Your Next Journey. Supporting sentence: Find the car that takes you there. Shortened the other two existing slides to one title and sentence; retained previous/next and opt-in play/pause behavior. Removed the hero eyebrow and promotional deal badge to reduce text.
- Kept existing homepage layout, hero heights, navbar, model search and subsequent sections. Mobile image position favors the vehicle and travel subject. Added EN/KR/RU translations within existing dictionaries. No GraphQL/auth/backend logic, dependencies or routes changed.
- Yarn phase/final typechecks and whitespace checks passed. Isolated browser checks verified desktop/tablet/mobile at 1440/768/390/320px, image loading, concise copy, bounds and existing controls. Final EN/KR and separate fresh-session RU checks passed; early repeated-navigation checks encountered locale readiness timing, and final checks wait for document scripts before activation. Desktop/mobile screenshots were reviewed and saved as anorcar-next/docs/screenshots/home-hero5-1440.png and home-hero5-390.png. No commit or deployment.

## 2026-10-10 - Homepage navbar parity with Cars

- Home and Cars now use the same existing Top component markup and shared marketplace-nav SCSS. Removed homepage-only white navbar overrides; reused the Cars white logo, dark translucent/fixed desktop navbar, active-link styling, link spacing and responsive rows. Home retains its own current-page link. Language-menu anchoring and account-button/image fallback behavior are shared.
- Adjusted only desktop homepage hero height/top spacing to keep existing copy and controls below the fixed navbar. Existing hero5 image, slideshow, search, translations, authentication and Apollo/GraphQL behavior are retained. Existing uncommitted hero work was preserved.
- Yarn typecheck and git diff --check passed. Separate temporary headless Chrome compared actual Home/Cars computed navbar geometry, background, logo and link container at 320/390/768/1024/1440/1920px, with additional RU mobile and KR desktop checks. All comparisons, current-page links, navigation bounds, hero clearance and language-menu anchoring passed with no uncaught runtime exceptions. Desktop/mobile screenshots were visually reviewed: anorcar-next/docs/screenshots/home-shared-navbar-1440.png and home-shared-navbar-390.png.
- Backend documentation is in docs, not the absent docs/ai directory. No backend source, contracts, data, dependencies, commit or deployment changes.

## 2026-10-10 - Homepage hero and compact search reference follow-up

- User clarified that the supplied reference also applies to the hero and Model Search. Enabled an opt-in compact presentation in the existing Home layout/Hero/HeaderFilter components. The hero shows the translated Find Your Next Car heading over the existing hero5 image; the white panel beneath it contains icon-led Make/Model/Year/Price controls and the orange Search submit. Desktop hero height/crop/spacing follow the reference; tablet/mobile use a two-column panel and full-width submit.
- The existing expanded Hero slideshow and HeaderFilter markup/logic remain available through their default mode. Home compact mode omits extra copy/controls, listing count and recommendation row; its unused count query is skipped. Preserved real Brand queries, listing-based/free-text model suggestions, filter state, CarsInquiry serialization, page reset and Cars route. No backend or new filter contract was added.
- Preserved the shared Cars/Home navbar and below-header sections, including existing Budget styles. Yarn phase/final typechecks and git diff --check passed. Separate temporary headless Chrome verified heading, image loading, left alignment, panel geometry, bounds and desktop/mobile layout at 320/390/768/1024/1440/1944px, plus narrow desktop-user-agent, KR desktop and RU mobile checks. Actual public catalog Make/Model/2024/price selections submitted to /car with exact brandIds/text/yearsRange/pricesRange and page 1/limit 9. No uncaught runtime exceptions occurred.
- Visually reviewed previews: anorcar-next/docs/screenshots/home-reference-hero-1944.png, home-reference-hero-1440.png and home-reference-hero-390.png. Existing uncommitted work retained. No backend source/data, dependency, commit or deployment changes.

## 2026-10-10 - Hero bottom-edge search and shorter copy

- Moved the existing compact Model Search panel to overlap the homepage hero bottom edge, expanded it to the hero content width, and reserved space before Browse by Budget on desktop/tablet/mobile. Kept shared Cars/Home navbar, real filters, model suggestions, search routing and other sections.
- Shortened compact hero title to the existing translated Find Your Car and added only the existing one-sentence Find the car that takes you there. copy. Reused EN/KR/RU keys; no new translations or unsupported marketing claims.
- Yarn typecheck and git diff --check passed. Separate temporary headless Chrome verified exact 50% panel overlap, left alignment, heading/nav clearance, no collision with Budget, viewport bounds, image and translated copy at 320/390/768/1024/1440/1944px, KR desktop, RU mobile and narrow desktop user agent. Actual make/model/year/price submit still passed with exact CarsInquiry serialization and no uncaught runtime exceptions. Desktop/mobile previews visually reviewed: anorcar-next/docs/screenshots/home-bottom-search-1944.png and home-bottom-search-390.png.
- No backend code/data, GraphQL/auth, dependencies, commit or deployment changes. Existing uncommitted work preserved.

## 2026-10-10 - Minimal hero overlap and heading refinement

- Changed only two frontend CSS declarations: compact Model Search translateY from 50% to 30%, yielding 70% inside the hero and 30% overlapping white content; desktop heading clamp maximum from 68px to 50px, retaining tablet/mobile typography. Existing panel width/height, centered placement, controls/gaps, subtitle, navbar, image, hero height and subsequent sections remain unchanged.
- Yarn typecheck and git diff --check passed. Isolated headless Chrome verified 70/30 ratio, horizontal centering, unchanged 102px desktop/248px tablet/240px mobile panel sizes, 50px desktop/44px tablet/36px mobile heading, hero heights and no section collisions at 320/390/768/1024/1440/1944px, KR desktop/RU mobile and narrow desktop user agent. Actual make/model/year/price search submit passed. Desktop/mobile previews reviewed; desktop panel remains below the Jeep. Mobile retains its existing image crop, with the raised panel overlapping the vehicle lower edge.
- Updated previews: anorcar-next/docs/screenshots/home-refined-search-1944.png, home-refined-search-1440.png and home-refined-search-390.png. No routing, GraphQL, backend functionality, dependencies, commit or deployment changes; prior uncommitted work retained.

## 2026-10-10 - Slightly larger compact Model Search

- Increased only compact search SCSS padding, field/button heights, internal alignment and corner radii. Desktop panel is 126px instead of 102px, with 74px controls; tablet uses 284px and mobile 260px with 70px fields/60px submit. Retained current width, horizontal centering and 70/30 overlap. Existing Make/Model/Year/Price controls, icons, search logic and translated copy remain; no unsupported vehicle-type/body-type filters were added.
- Yarn typecheck and git diff --check passed. Separate temporary headless Chrome verified actual panel dimensions, 70/30 overlap, centering, bounds, section clearance and unchanged responsive heading sizes at 320/390/768/1024/1440/1944px, KR desktop/RU mobile and narrow desktop user agent. Existing real make/model/year/price submit passed without uncaught runtime exceptions. Desktop/mobile previews reviewed: anorcar-next/docs/screenshots/home-larger-search-1440.png and home-larger-search-390.png.
- No routing, Apollo/GraphQL, backend functionality/data, dependency, commit or deployment changes. Existing uncommitted work retained.

## 2026-10-10 - Reference-style search category and budget rows

- Corrected the prior interpretation: resizing controls alone did not reproduce the user's multi-row reference. Added a compact top row for Cars/Used/New/Electric/Hybrid and a bottom row of five illustrated USD price shortcuts, using existing translations, budget assets and existing conditions/fuelTypes/pricesRange fields. Cars clears condition/fuel category selection; budget shortcut selection updates the existing Price dropdown and can be toggled off. Main Make/Model/Year/Price/Search controls and expanded-mode markup remain.
- Reference motorcycles/caravans/trucks/trailers and body types are not in the existing backend contract, so no fake or inert categories were added. Existing real Car filters provide functional alternatives; no schema/API/data changes were introduced.
- Kept the panel's previous top edge by anchoring the larger panel to the hero with responsive insets (desktop 88px/tablet 199px/mobile 182px); extra rows expand downward. Reserved the previous panel height within the hero to preserve copy position, and increased only following clearance to prevent section collision. This supersedes the percentage overlap for the expanded panel. Navbar, heading/subtitle/image, hero height and below-header section contents remain.
- Yarn phase/final typechecks, lint (warnings/no errors) and git diff --check passed. Separate temporary headless Chrome verified geometry/centering, preserved upper edge, controls bounds, section clearance and desktop/mobile/localized layouts at 320/390/768/1024/1440/1944px, KR desktop/RU mobile and narrow desktop user agent. All four category switches, Cars reset, five price selections, price deselection and actual combined USED/make/model/year/price search serialization passed without uncaught runtime exceptions.
- Final desktop/mobile screenshots visually reviewed: anorcar-next/docs/screenshots/home-search-rows-1944.png, home-search-rows-1440.png and home-search-rows-390.png. Mobile category/budget rows scroll horizontally. No routing, Apollo/GraphQL/backend functionality, dependencies, commit or deployment changes. Existing uncommitted work preserved.

## 2026-10-10 - Exact two-row Model Search reference

- Matched the latest supplied two-row reference: existing Cars/Used/New/Electric/Hybrid controls above a thin separator, then Make/Model/Year/Price/Search. Removed only the compact illustrated budget footer and its CSS/unused image mapping. Existing Price dropdown and expanded-mode recommendation logic remain.
- Compact desktop panel now has 16px padding, 60px controls, 12px gaps and 137px overall height. Preserved top anchor, width/centering and hero content/height/image/navbar. Reduced following clearance to fit the smaller panel. Tablet/mobile retain two-column fields, full-width submit and horizontal category scrolling.
- Yarn typecheck and git diff --check passed. Separate temporary headless Chrome verified no footer, all five categories, 60px inputs, bounds, centering, preserved top edge and no following-section collision at 320/390/768/1024/1440/1944px, KR desktop/RU mobile and narrow desktop user agent. Category switches/reset and real combined USED/make/model/year/price search submit passed without uncaught runtime exceptions. Desktop panel and mobile screenshots visually reviewed.
- Latest preview: anorcar-next/docs/screenshots/model-search-two-row-panel.png; full desktop/mobile: home-two-row-search-1944.png, home-two-row-search-1440.png and home-two-row-search-390.png. No backend source/data, routing, GraphQL, dependencies, commit or deployment changes. Existing uncommitted work preserved.

## 2026-10-10 - Final small search spacing refinement

- Raised the two-row Model Search panel exactly 12px. Reduced hero following margins by 30px so the actual panel-to-Browse-by-Budget gap decreases by 18px after accounting for the upward panel shift. Only four scoped SCSS declarations changed; panel width/height/controls, hero typography/content/image/height and search logic remain.
- Yarn typecheck and git diff --check passed. Isolated read-only headless Chrome measured the exact 12px upward shift and 18px gap reduction at 1440/768/390/320px; panel heights remain 137/292/271px, hero heights remain 520/620/560px, controls stay in viewport and gaps remain positive. No uncaught runtime exceptions.
- No routing, GraphQL/backend functionality/data, dependencies, commit or deployment changes. Existing uncommitted work preserved.

## 2026-10-10 - Agents browse reference UI

- Updated sibling anorcar-next existing /agent and AgentCard in place with the supplied four-column portrait-card reference, nickname search, supported sort menu, orange grid/list toggles, real counts/addresses/memberCars, heart controls and real profile links. Omitted the red annotation and profile arrows. Shared navbar/banner/footer and existing Pages Router/LayoutBasic/Apollo/MUI/SCSS architecture remain.
- Replaced mobile placeholders with responsive 4/3/2/1 grid and list layouts. Preserved GET_AGENTS, LIKE_TARGET_MEMBER/refetch, guest guard, USER/AGENT/ADMIN roles and canonical types. URL query state survives reload; search/sort reset page; default memberRank DESC/page 1/limit 8. Added literal regex escaping, malformed-URL fallback, image fallback, pending-like protection, loading/empty/reset/error/retry and EN/KR/RU keys.
- Backend AISearch supports nickname text only, so unsupported city filters/counts and full-name search were not invented. Real memberAddress is displayed and missing locations remain explicit. No backend source/schema/data change or demo seeding. Authenticated like persistence was not exercised in this read-only task.
- Yarn phase/final typechecks, lint (no errors; existing warnings), migration/auth checks, live 42-operation GraphQL/three-upload/enum checks, 91-page production build and whitespace checks passed. Isolated headless Chrome checked actual API order/IDs/counts, 1440/1024/768/390/320px grid/list bounds, portraits, search/literal punctuation, empty/reset, sorting, pagination/reload, invalid input, guest like, KR/RU and error/retry without runtime exceptions. Initial hydration mismatch and toolbar/photo sizing issues found during QA were fixed. Dev locale cache warmed after adding new translations.
- Desktop/mobile screenshots visually reviewed: anorcar-next/docs/screenshots/agents-directory-1440.png and agents-directory-390.png. Full report and QA script: anorcar-next/docs/AGENTS_BROWSE_UI.md and scripts/qa-agents-directory.cjs. Unrelated concurrent car.enum.ts formatting was preserved. No dependency/lockfile changes, commit or deployment. Handoff docs are in docs; docs/ai remains absent.


## 2026-10-10 - AUTOMATIC and DAEJEON backend/frontend correction

- User explicitly requested the canonical spellings in backend/frontend. Updated the backend Car enum, DTO validation tests, frontend enum/helper and migration/compare fixtures. Dynamic forms, filters, cards, admin and comparison controls use the same canonical values; added Daejeon EN/KR/RU translations. Backend AGENTS.md now reflects the approved contract and supersedes the earlier misspelled values. Other enums, roles and existing architecture remain.
- Frontend parseCarsInquiry normalizes the two old bookmark filter values and deduplicates them; outgoing requests use AUTOMATIC/DAEJEON. No legacy GraphQL aliases were added. Old API enum inputs are rejected.
- Added backend scripts/migrate-car-enum-spelling.cjs: read-only by default, development-only, guarded raw collection updates and snapshot before --apply. Migrated exactly 13 development car documents: 13 AVTOMATIC transmission fields and 2 DAEJON locations, overlapping in the same cars. Counters/timestamps/unrelated fields preserved. Subsequent dry-run found zero legacy values. Previous enum snapshot: C:/Users/behru/AppData/Local/Temp/anorcar-car-enum-spelling-1791619130261.json.
- Backend API/batch typechecks and both builds passed; focused CarInput/mileage suites passed 35 tests. Frontend Yarn typecheck, migration/auth/compare/restoration checks and 91-page production build passed, with existing lint warnings/no errors. Live validation passed for 42 GraphQL documents, three inline uploads and enum parity. Read-only API check confirmed all 15 active cars serialize, canonical filters match actual inventory and old enum inputs fail.
- Desktop actual filter selection and old-bookmark restoration returned the same two real Daejeon/Automatic cars with exact canonical inputs. Preview: anorcar-next/docs/screenshots/car-enum-corrected-filters.png. Russian dev dictionary cache required a frontend-server restart. Further final browser results are in sibling docs/CAR_ENUM_SPELLING.md.
- Preserved prior Agents and mileage work and unrelated changes. No dependencies/lockfiles, Git commit or production deployment. Current handoff location is docs, not the absent docs/ai directory.
- Final isolated browser validation passed for desktop Automatic/Daejeon labels, exact canonical filter serialization, two real matching listings, old bookmark normalization and KR/RU mobile labels without runtime exceptions. Preview visually reviewed. Clean Yarn dev restart resolved stale dictionaries/repeated 404s; old .next-dev cache retained in TEMP (anorcar-enum-dev-cache-d2e1530c-5654-42aa-95f7-46874761c583). Final HTTP responses were 200; dev remains on 3000, API on 3007.

## 2026-10-10 - Agent detail reference UI

- Rebuilt the frontend agent detail presentation incrementally around the existing Apollo/member/car/comment contracts and Next Pages Router. Large portrait, breadcrumbs, role/name/address/bio, contact/like/share actions, real active-car/follower/profile-view statistics and Listings/About/Contact tabs. Unsupported happy-client/experience statistics and fabricated ratings were omitted.
- Public inventory uses getCars with the exact memberId, four items per page and View All preserving that owner filter. Existing browse CarCard reused; original card Sass extracted to a shared mixin. Existing Cars browse regression browser suite passed including filters/grid/list/mobile drawer, bounds/equal heights and EN/KR/RU.
- Existing member-like/car-like/comment mutations preserved; GET_MEMBER now requests its supported meLiked field. Guest/self/empty/pending guards, 100-character review form, real review authors/dates, error/retry/empty/loading states, missing/broken portrait fallback, active AGENT/ID matching and retained tab/form state on profile refetch. Phone uses the stored tel value; native share/clipboard/selectable-link fallback preserves locale.
- Marketplace navigation remains active on detail and the generic oversized banner is removed for this route. Responsive 4/2/1 inventory cards and complete EN/KR/RU detail strings.
- Frontend phase typechecks, lint (existing warnings/no errors), migration/auth checks, 42 GraphQL operations/three inline uploads/enums and final 91-page production build passed. Isolated read-only Chrome checks exercised five viewport widths from 320 to 1440px, owner filter/pagination, guest guards, contact focus/tel, share fallback, real portrait/empty inventory, invalid ID and locales without runtime exceptions. Authenticated mutation writes were not executed against the development database.
- Full report: anorcar-next/docs/AGENT_DETAIL_UI.md; reproducible check: scripts/qa-agent-detail.cjs. Visually reviewed screenshots: agent-detail-1440.png, agent-detail-390.png and agent-detail-portrait.png. Existing development seller has 14 cars and no portrait; stored portrait demo agents have zero listings. No data seeded/changed for this task, backend source/schema changes, dependencies, commit or deployment.
- Read instructions from AGENTS.md and docs migration/handoff files; docs/ai remains absent. Frontend dev dictionary cache required a restart to serve the new translations.

## 2026-10-10 - Agent detail compact UI refinement

- Followed the supplied refinement brief without changing the existing Pages Router, Apollo/GraphQL contracts, navbar, typography/colors, authentication, likes, comments, contact, profile views or routing. Backend instructions/handoff were read from AGENTS.md and docs (docs/ai is absent).
- Only sibling agent detail UI code/styles changed: 250px square desktop/tablet portrait, mobile square capped at 250px and accessible nickname initials for missing/failed images; tighter name/username/location/description spacing, consistent smaller statistic cards, refined tabs/underline and reduced listings/pagination/page whitespace. Preserved real backend counters and missing-data states.
- Reused the existing CarCard unchanged. Detail-scoped SCSS reserves two title lines, aligns metadata/prices, standardizes Sale/Rent/Barter/combined badges and adds subtle hover/focus border/shadow without animation. Four/two/one grid remains; View All preserves the selected memberId filter and full Cars search controls. Other frontend pages and shared card styles are untouched.
- Yarn typecheck and lint passed (existing lint warnings); production build generated 91 pages. Expanded the existing isolated read-only Chrome suite: 320/390/768/1024/1440px bounds, square portraits/nickname initials including blocked-image fallback, two-line title reservation, equal card heights/prices, owner-filtered View All/pagination, guest guards, contact focus/tel, share/locale, tabs, empty/error/Retry and EN/KR/RU all passed without runtime exceptions. Authenticated mutation writes were not executed against the development database.
- Modified frontend pages/agent/detail.tsx, scss/pc/agent/detail.scss, scripts/qa-agent-detail.cjs, docs/AGENT_DETAIL_UI.md and three refreshed screenshots. Desktop/mobile/portrait screenshots visually reviewed. No backend source/schema/data, dependencies, commit or deployment changes; this backend edit is documentation only.

## 2026-10-10 - Community browse discussion reference UI

- Updated sibling anorcar-next /community around the existing Pages Router, MUI, SCSS and Apollo contract. Horizontal All Posts/FREE/RECOMMEND/NEWS/HUMOR filters, title search, supported Latest/Oldest/Most liked/Most viewed sorts, grid/list view and six-post pagination. Tips & Guides and verified-conversation claims are unsupported and were omitted.
- Readable URL query state preserves category/search/sort/page/view, with page reset on filter changes and safe literal regex escaping for title search. Existing articleCategory links remain valid. Frontend BAISearch category is now optional to match the existing backend; no backend contract/schema/source changes.
- Existing CommunityCard receives an opt-in browse variant; My Articles/Member Articles legacy cards/callbacks remain. New cards use real image/category/title/text-only excerpt/author/avatar/date/views/likes/comments, actual article/member links, pending-like protection and guest guards. Likes now work across all categories. Write a Post keeps /mypage?category=writeArticle and requires login.
- Responsive 3/2/1 grid and list layout, image/author fallback, loading/empty/reset/error/Retry and EN/KR/RU. Kept the user's hero7 and contrast treatment; mobile Community gets the hero/shared marketplace navigation. Other page layouts and dependencies remain.
- Yarn typecheck, lint (existing warnings/no errors), migration/auth checks and 91-page production build passed. Live GraphQL validation passed for 42 operations, three inline uploads and enums. Isolated read-only Chrome verified the 16 existing development posts at 320/390/768/1024/1440px: bounds, grid/list, real IDs/routes, category/All, literal title search, empty/reset, sorting/reload, pagination, guest like/write, KR/RU and outage/Retry without uncaught runtime exceptions. Authenticated mutation writes were not exercised against the development database.
- Desktop/mobile screenshots visually reviewed after loading all images: anorcar-next/docs/screenshots/community-browse-1440.png and community-browse-390.png. Full report: docs/COMMUNITY_BROWSE_UI.md; reproducible check: scripts/qa-community-browse.cjs. No records seeded or modified, fake product data, Git commit or deployment. Existing demo-post content is shown unchanged. Dev server restart resolved stale translation dictionaries. Handoff location remains docs; docs/ai is absent.

## 2026-10-10 - Community listing UI refinement

- Refined only sibling anorcar-next/scss/pc/community/community.scss, scoped to content below the hero and above the footer. Existing NESTAR-derived Pages Router/component structure, Apollo/state, routes, authentication, backend contracts, enum categories and translations remain unchanged. No new files/components/dependencies or data changes.
- Tighter header/section spacing, orange pill filters with horizontal scrolling, matching 44px search/sort/view controls and visible focus/hover states. Existing cards retain all real content/metadata with 16:10 cover images, two-line titles/excerpts, bottom-aligned metadata, soft shadows and reduced-motion-aware elevation. Refined pagination and existing loading styles; preserved 3/2/1 grid/list behavior.
- Yarn typecheck and 91-page production build passed; build lint retained existing warnings. Existing read-only Chrome suite now verifies equal control heights, image ratio, metadata clearance, search focus and mobile pill scrolling, alongside existing functionality/localization/retry checks at 320/390/768/1024/1440px. All passed without runtime exceptions; refreshed desktop/mobile screenshots visually reviewed and git diff --check passed.
- Report: anorcar-next/docs/COMMUNITY_BROWSE_UI.md. No navbar/hero/footer changes, authenticated mutation writes, backend source/schema/data changes, commit or deployment. Handoff is in docs because docs/ai is absent.

## 2026-10-10 - My Account and My Profile reference UI

- Updated sibling anorcar-next My Page shell, existing MyMenu and MyProfile to the supplied reference: breadcrumbs/title, compact user card, grouped sidebar, round profile photo, username/phone/address fields and Cancel/Save Changes. Responsive desktop/mobile and EN/KR/RU. Existing AGENT-only listing links, admin access, category routes/legacy normalization and logout remain.
- Preserved NESTAR-derived Pages Router/layout HOC/MUI/SCSS/Apollo architecture, existing UPDATE_MEMBER and multipart imageUploader(target: member), JWT storage/user refresh. Added safe optional photo removal/address, draft reset, MIME/5 MB validation, pending/error states, duplicate-save and stale-account guards. Unsupported SKT verification/zipcode integrations were omitted.
- Yarn phase/final typechecks, lint (warnings/no errors), migration/auth checks, live 42-operation GraphQL/three-upload/enum validation and final 91-page production build passed. Isolated Chrome tested 320/390/768/1024/1440px, actual form interactions, optional empty values, Cancel/save/upload success/error, validation, JWT refresh, duplicate saves, EN/KR/RU, USER/AGENT/ADMIN menus and logout/guest redirect without runtime exceptions. Authenticated API responses were intercepted browser fixtures; no live database mutations/uploads.
- Report and reproducible QA: anorcar-next/docs/MY_PROFILE_UI.md and scripts/qa-my-profile.cjs. Visually reviewed fixture previews: docs/screenshots/my-profile-fixture-1440.png and my-profile-fixture-390.png. Dev server restarted for corrected UTF-8 dictionaries and remains on 3000. Other My Page section implementations remain; their UI/mobile follow-ups are outside this profile slice.
- Instructions/handoff read from AGENTS.md and docs; docs/ai is absent. No backend source/schema/data, dependencies/lockfiles, commit or deployment changes. This backend entry is documentation only.


## 2026-10-10 - My Page professional UI refinement

- Refined sibling My Page within the existing NESTAR-derived Pages Router/layout/MyMenu/MyProfile/MUI/SCSS/Apollo structure. Account-scoped hero4 is now 300px desktop/220px mobile; removed duplicate subtitle, tightened spacing and refined typography, sidebar, card header/photo panel/borders/shadows. My Page now has a navbar active state.
- Mobile account navigation expands from the existing MyMenu with accessible MUI controls and collapses on category changes. Existing category routes and AGENT/admin links remain. Profile footer explains unchanged/unsaved/invalid/uploading/saving states; added backend-compatible username guidance, linked blur validation, optional address and draft/error reset.
- Corrected invalid/repeated category URLs and empty carId pollution, preserving legacy category mappings and relevant IDs. Existing UPDATE_MEMBER/upload/auth/JWT business flows remain; no new backend contract.
- Yarn phase typechecks, migration/auth/translation checks and final 91-page build passed with lint warnings/no errors. Expanded isolated Chrome QA passed at 320/390/768/1024/1440px: hero/menu/bounds, invalid URL fallback, keyboard blur validation, save-state/JWT refresh, Cancel, upload/save success/errors, duplicate guards, optional empty data, EN/KR/RU, USER/AGENT/ADMIN and logout. Authenticated API replies were fixtures; no live data writes or runtime exceptions.
- Current report: anorcar-next/docs/MY_PROFILE_UI.md; QA: scripts/qa-my-profile.cjs. Refreshed desktop/mobile screenshots plus my-profile-admin-empty-1440.png were visually reviewed. Dev remains on 3000 after locale reload. No backend source/schema/data, dependencies/lockfiles, commit or deployment changes. Handoff remains in docs; docs/ai is absent. This backend entry is documentation only.


### 2026-10-10 — ANORCAR My Page attached-brief UI refinement

- Preserved NESTAR Pages Router/MUI/SCSS/Apollo architecture, existing member fields/UPDATE_MEMBER/upload/JWT flows, EN/KR/RU and all role-based menu links. Navbar/footer unchanged in this phase.
- Kept hero4 coastal-road SUV image; compact 300px desktop/220px mobile banner now positions the vehicle fully in view. Aligned hero/content to a 1300px container, 250px desktop sidebar, 24px gap and independent card heights.
- Improved typography, sidebar density, profile card/form spacing, border-free photo section with 88px avatar, #F04432 focus/primary styling and distinctly disabled Save state. Mobile retains collapsible account navigation and stacked fields.
- Yarn typecheck and production build passed (existing lint warnings). Isolated Chrome QA passed at six widths including 1920px, three locales and USER/AGENT/ADMIN, with save/upload/Cancel/validation/logout coverage. All authenticated QA responses are intercepted browser fixtures; no live member writes or uploads.
- Frontend report: anorcar-next/docs/MY_PROFILE_UI.md; previews in docs/screenshots. Backend source/schema/data untouched.


## 2026-10-10 - Write Article UI and editor refinement

- Refined sibling anorcar-next WriteArticle/Teditor in the existing NESTAR Pages Router/layout/MUI/SCSS/Apollo architecture. Existing navbar/footer/account hero/role sidebar/routes remain. Added article-specific heading and responsive white editor card; replaced the old mobile placeholder with the functional form.
- Preserved Toast UI Markdown/WYSIWYG and original formatting commands; wrapping toolbar, branded Upload File/Image URL insertion dialog, optional alt text, existing multipart uploader target article and optional articleImage cover preview/change/remove. Retained inline-image thumbnail fallback until a cover override.
- Added field validation, Publish Article/Cancel, actual error feedback, upload/publish pending and duplicate guard, discard confirmation and My Articles redirect. No drafts/autosave. Backend title 3-50/content 3-250 HTML character limits and image MIME/15,000,000-byte constraints remain unchanged and visible in the UI.
- Fixed installed editor React wrapper unmount cleanup/Strict Mode contamination; locale remount retains content and unmount aborts pending uploads. Existing four-field CREATE_BOARD_ARTICLE input preserved.
- Yarn phase/final typechecks and 91-page production build passed with existing lint warnings. Read-only GraphQL validation passed for 42 operations/three uploads/enums. Isolated Chrome QA passed at five widths, EN/KR/RU, Agent links, rich editor/modes, image file/URL/cover/errors, validation, publish error/success/pending/duplicate guard and Cancel. All authenticated API replies were fixtures; no live writes/uploads.
- Report: anorcar-next/docs/WRITE_ARTICLE_UI.md; QA: scripts/qa-write-article.cjs; visually reviewed fixture screenshots in docs/screenshots. Backend source/schema/data, dependencies, commit and deployment untouched. Handoff uses docs because docs/ai is absent.


## 2026-10-12 - CS Help Center reference UI

- Developed sibling anorcar-next /cs within the existing NESTAR-derived Pages Router/layout HOC/MUI/SCSS/Apollo structure. Shared marketplace navbar with CS active state, compact dark search hero, six help topics, category/search FAQ, thirteen practical answers, existing support email and responsive mobile replacing placeholders. Preserved roles, authentication, routes and footer.
- EN/KR/RU help copy; shallow URL query restoration and legacy tab=faq/notice links; accessible accordion IDs, focus states, empty/reset. Existing Notice now uses GET_BOARD_ARTICLES for the latest three actual NEWS posts, real IDs/dates/safe excerpts and loading/empty/error/Retry states. Community posts are labeled as such; no fabricated official announcements or support ticket API.
- CS-scoped wrapping/grid fixes prevent mobile overflow. Existing closed chat is hidden until opened on CS; chat business logic remains. No dependencies/lockfiles, backend code/schema/data, Git commit or deployment changes.
- Yarn phase/final typechecks, migration/auth checks, live 42-operation GraphQL/three-upload/enum validation and 91-page production build passed with existing lint warnings. Read-only Chrome suite passed at 1440/1024/768/390/320px, search/category/accordion/links/URL reset, native typing/Enter, real news IDs, KR/RU mobile and backend outage/Retry without runtime exceptions. No live data writes. Desktop/mobile screenshots visually reviewed.
- Report: anorcar-next/docs/CS_UI.md; QA: scripts/qa-cs.cjs; previews: docs/screenshots/cs-help-1440.png and cs-help-390.png. Frontend dev restarted to refresh locale caches and remains on 3000; API remains on 3007. Handoff is in docs because docs/ai is absent. This backend entry is documentation only.

## 2026-10-12 - CS content simplification

- Simplified sibling CS after user feedback about excess text and search necessity. Removed the large hero search and duplicate popular chips, eyebrow, section descriptions/note and FAQ kicker. Kept helphero1, short hero copy and one Explore help topics anchor. Shortened topic/support copy in EN/KR/RU; FAQ answers start collapsed.
- Topic cards and category filters replace the search entry UI. Existing q-based bookmarks, tab=faq/notice, clear/no-result states and routing remain supported. Existing FAQ answers/links, Apollo community news, support email, shared navigation/footer and architecture remain.
- Yarn typecheck passed. Updated read-only Chrome suite passed at five widths and three locales, categories, accordions, legacy query/reset and news outage/Retry without runtime exceptions. Refreshed desktop/mobile screenshots visually reviewed. Production build compiled and generated 91 pages; final result is recorded in sibling docs/CS_UI.md.
- No backend code/schema/data, dependency/lockfile, commit or deployment changes. Handoff uses docs because docs/ai is absent. This backend entry is documentation only.

## 2026-10-12 - CS below-hero reference layout

- Updated only sibling anorcar-next CS content below the existing hero. Hero, shared navbar/footer and NESTAR-derived Pages Router/layout/MUI/SCSS/Apollo architecture remain. Existing Faq/Notice/Inquiry reused; no new dependencies or backend operation.
- Refined topic cards, six-question FAQ preview with View all/Show fewer, category/legacy query behavior, contact card and dark support banner. Browse FAQ replaces the unsupported AI-assistant action. NEWS cards use real existing article images/IDs/titles/dates/safe excerpts and detail links, with image fallback and loading/empty/error/Retry.
- Added responsive name/email/topic/message form with validation and an Open email draft action for existing info@anorcar.com. User reviews/sends in their email app; no direct-send API or response-time/support-hours promise. Google map shows Seoul City Hall as a clearly labeled reference location, not a company office. EN/KR/RU included.
- Yarn phase/final typechecks, migration/auth checks, live 42-operation GraphQL/three-upload/enum validation and final 91-page production build passed with lint warnings. Read-only Chrome passed five widths, preview/expand/categories/links, images, legacy query/reset, unchanged hero controls/border, blank-message validation, subject selection and encoded email drafts. Email opening was intercepted; no real messages/database writes. KR/RU and outage/Retry passed without runtime exceptions. Desktop/mobile and separate visible map screenshots reviewed.
- Report: anorcar-next/docs/CS_UI.md; QA: scripts/qa-cs.cjs; previews: docs/screenshots/cs-help-1440.png, cs-help-390.png and matching -map.png files. Resolved two frontend dev servers sharing the same cache by restarting one on 3000; API remains on 3007. No backend source/schema/data, dependency/lockfile, commit or deployment changes. Handoff is in docs because docs/ai is absent. This backend entry is documentation only.

## 2026-10-12 - FAQ below-hero design polish

- Refined only existing sibling CS below-hero SCSS: consistent topic-card heights, smaller icon tiles, white FAQ panel, more readable filters/questions, lighter support card, balanced support banner and aligned article text areas. Contact form/map columns now align; form text and mobile panel spacing refined. Open map consistently uses Google Maps.
- Hero/navbar, NESTAR Pages Router/component structure, Apollo/backend contracts and existing FAQ/form behavior remain. Ask AI Assistant remains an explicitly unavailable action until an AI backend is connected; Contact support remains functional.
- Yarn typecheck and 91-page production build passed with lint warnings. Existing read-only Chrome passed five widths and three locales, FAQ preview/expansion/categories, article IDs/images, legacy query/reset, intercepted encoded email draft/validation and backend Retry without runtime exceptions. Refreshed previews visually reviewed.
- Report: anorcar-next/docs/CS_UI.md. Resolved recurring two-dev-server cache interference by restarting one frontend on 3000. No backend source/schema/data, dependencies/lockfiles, commit or deployment changes. Handoff is in docs; this entry is documentation only.


## 2026-10-12 - FAQ authenticated messages to admin inquiries

- Added Inquiry in the existing NESTAR Nest resolver/service/module + libs DTO/enum + Mongoose schema architecture; registered InquiryModule in ComponentsModule. Timestamped inquiries collection with newest/status indexes. No existing data migration or unrelated module changes.
- createInquiry uses existing AuthGuard/AuthMember; owner comes from verified JWT. DTO validation and explicit storage allowlist prevent client-set ownership/status. getAllInquiriesByAdmin and updateInquiryByAdmin use existing ADMIN RolesGuard. Literal name/email/message search, bounded pagination, NEW/READ/CLOSED lifecycle; no delete or reply feature.
- Sibling frontend /cs now sends via typed Apollo mutation with login requirement, pending submission lock, retained values on failure and cleared form only after a saved ID. Replaced email-draft flow. Real admin InquiryList/page supports detail, search/filter/pagination/refresh, read/close/reopen, empty/error/Retry; added missing CS -> 1:1 Inquiry menu entry. Hero/navbar/footer/FAQ/news/map preserved; EN/KR/RU included.
- No Telegram, email delivery, notifications/socket events, dependencies, credentials, deployment or commit. Receiving messages and managing their status only; no buyer response flow.
- Frontend phase/final typechecks and 91-page build, backend API/batch typechecks and Nest build passed. Existing frontend lint warnings remain. Live backend contract validated 45 frontend operations, three uploads and enums.
- Nine isolated GraphQL tests exercised resolver/service, actual guards/JWT/ValidationPipe/Mongoose schema with an in-memory adapter: authorization, invalid/spoofed input, owner binding, search/pagination, status and storage errors. Browser fixtures covered buyer submission/retry/double-click/reset at desktop/mobile and admin list/detail/pagination/status/reopen/filter/search/error/Retry. Existing five-width/three-locale CS browser suite passed. No development database mutations or real messages during tests.
- Report: anorcar-next/docs/CS_INQUIRIES.md; QA: scripts/qa-inquiries.cjs and scripts/qa-cs.cjs; previews: cs-inquiry-sent-1440/390, admin-inquiries-1440 and admin-inquiry-detail-1440. Handoff remains in docs because docs/ai is absent.


## 2026-10-12 - 15 minute access JWT and 30 day refresh sessions

- Preserved NESTAR AuthModule/MemberResolver/service/DTO/schema and frontend Apollo/Pages Router architecture. Filled existing TokenRefreshLink placeholder. No dependency, notification, refresh UI, deployment or commit added.
- Access JWT expiry and max verification age are 900 seconds; legacy 30-day JWTs also expire by age. Existing login/signup Member.accessToken responses remain and issue opaque HttpOnly refresh cookies. Explicit GraphQL req/res context, trusted CORS/Origin + custom client header for cookie auth actions, Secure production cookie and sensitive-log redaction.
- AuthSessionService/AuthResolver in existing auth component; libs DTO/config and RefreshSession Mongoose schema. Hash-only refreshSessions with fixed 30-day expiry/TTL, authenticated ownership, atomic rotation/history, verified replay revocation and current ACTIVE member role/status. Logout revokes the current browser session and clears cookie. No existing records migrated/deleted.
- Frontend silently queues/refreshes, retries server expiry once, shares concurrent requests, uses Web Locks across supported browser tabs and prevents stale transport forwarding on refresh failure. Offline failures preserve session for retry; logoutPending and session versions prevent restoration after offline logout or late responses. Admin redirects wait for authReady; upload/chat paths obtain fresh credentials. Access token stays in existing localStorage; refresh token is HttpOnly only.
- Socket identity is no longer retained after access expiry; client credentials update the existing connection. Old users without refresh cookies must authenticate once. Production CLIENT_ORIGINS must list exact frontend origins; same-site HTTPS deployment is recommended. Truly cross-site cookie configuration is documented.
- API/batch and frontend typechecks, backend Nest and frontend production builds, migration/auth checks, actual helper tests and live 47-operation/three-upload/enum schema check passed (existing lint warnings). 19 isolated backend auth/cookie/rotation/logout/socket/Inquiry tests passed; browser fixtures verify silent desktop/mobile refresh, one server retry, header update, admin hydration and logout. No live database/account/message mutations in tests.
- Report: anorcar-next/docs/AUTH_REFRESH.md; frontend scripts/check-auth-session.cjs and scripts/qa-auth-refresh.cjs; backend auth-session.spec.ts. Handoff uses docs because docs/ai is absent.

## 2026-10-12 - Frontend login and signup UI

- Updated sibling anorcar-next's existing /account/join with ANORCAR automotive desktop/mobile UI. Direct signup uses ?mode=signup; shared marketplace navbar is above the form. Existing Pages Router/layout/MUI/SCSS/Apollo auth helpers and 15-minute access/30-day HttpOnly refresh sessions remain.
- Added labeled/autocomplete fields, masked/show-hide passwords, signup confirmation, buyer USER/seller AGENT radios, backend-aligned nickname 3-12/password 5-12 validation and phone presence validation. Enter submits; synchronous pending lock prevents duplicate requests; inline errors retain values for retry. Safe local referrer survives mode changes and is used after authentication. Help uses existing CS; removed unconnected remember-me/reset controls. EN/KR/RU translations added.
- Phase/final Yarn typechecks, existing auth session regression tests, diff check and 91-page production build passed with lint warnings. Isolated Chrome GraphQL fixtures passed five viewport widths, navbar clearance/images, validation, show-hide, duplicate-submit lock, trimmed payloads/roles, credentials/headers, backend/network errors/retry, successful sessions and safe returns, query mode switching and KR/RU mobile. No live account/database writes; final desktop/mobile screenshots visually reviewed.
- Resolved two dev servers sharing .next-dev by restarting a single frontend on 3000; backend remains on 3007. Report: anorcar-next/docs/LOGIN_SIGNUP_UI.md; QA: scripts/qa-login.cjs; previews: docs/screenshots/auth-login-1440.png, auth-signup-1440.png, auth-login-390.png, auth-signup-390.png and auth-page-1440.png.
- No backend code/schema/data, dependency/lockfile, commit or deployment changes. Handoff remains in docs because docs/ai does not exist.

## 2026-10-13 - Gemini AI Assistant integration

- Added AiModule/resolver/service under existing components and AI DTO/config under libs; registered in ComponentsModule. Official backend-only @google/genai 2.28.0, configurable Flash model (default gemini-3.5-flash-lite), current-message-only askAiAssistant mutation and typed answer. No collections, RAG/search/tools, conversation persistence or provider fallback.
- Anonymous IP and verified-user quotas, bounded in-memory buckets, aggregate UTC-day and concurrent-request caps, 1000-character validation, trusted-origin/client-header checks, deadline/abort, one provider attempt and 200-token default. Concise multilingual server instructions include verified platform features and prohibit fabricated/private data or human-agent claims. API key remains backend-only; provider errors are redacted. AI request/answer logging is suppressed, including inline/mixed mutation requests.
- Sibling frontend preserves Pages Router/Apollo/MUI/SCSS. Adjacent fixed AI/Live Chat launchers in existing layouts and mobile, mutually exclusive panels, localized EN/KR/RU UI, suggestions, plain text messages, bounded local history, loading/inline error/retry, Enter/Shift+Enter/IME, Escape/focus restoration and scrolling. Existing Chat transport preserved with optional controlled visibility; FAQ's existing AI action opens the same widget. No duplicate launcher or new frontend dependency.
- API/batch typechecks and Nest build, 18 isolated AI/SDK/GraphQL/security/cost tests, 10 existing backend auth tests, frontend typecheck/auth checks, 48-operation/three-upload/enum schema validation and 91-page production build passed with existing lint warnings. Browser fixtures passed four widths, three UI locales, Uzbek text rendering, preserved WebSocket send, exclusivity, keyboard, pending/error/retry, no global popup, home/mobile/FAQ and no uncaught runtime errors; screenshots reviewed. No paid Gemini calls, real chat messages or database writes.
- GEMINI_API_KEY is not configured yet. Real provider authentication, brevity/language quality and adversarial model responses await a key. Limits are per API process and reset on restart; replicated deployments need a shared gateway limiter/project quota. Existing Live Chat is a shared conversation, not staffed private operator routing.
- Configuration: backend .env.ai.example. Report: sibling anorcar-next/docs/AI_ASSISTANT.md; frontend QA scripts/qa-ai-assistant.cjs; screenshots docs/screenshots/ai-*.png. Existing unrelated backend work preserved. No deployment or commit. Handoff remains in docs because docs/ai does not exist.

## 2026-10-13 - Gemini activation model correction

- GEMINI_API_KEY is now configured, but local GEMINI_MODEL had been set to gemini-2.5-flash-lite. A real provider test returned HTTP 404 / NOT_FOUND stating that this model is unavailable to new users and recommending gemini-3.5-flash-lite.
- Updated only GEMINI_MODEL in the ignored backend .env to the original integration choice gemini-3.5-flash-lite; key unchanged and never printed. Triggered existing Nest watch reload. Actual SDK test succeeded (STOP) and real askAiAssistant returned a concise answer.
- Clarified verified platform guidance: choose Agent during signup, then My Page > Add car; no invented self-service User-to-Agent upgrade. Actual response then gave the correct signup flow in under 60 words.
- All 18 AI tests and API typecheck passed. No frontend behavior or schema changes. Temporary diagnostic script removed. Updated AI_ASSISTANT.md in both repositories. No commit or deployment.

## 2026-10-13 - Live Chat UI and online counter

- Sibling frontend Live Chat now uses a compact ANORCAR header, sender names, avatars, readable bubbles and brand-colored composer with localized EN/KR/RU labels.
- Server info.totalClients is displayed directly through 30 and as 30+ above 30; accessible label and tooltip retain the full count. Removed fake initial 4 and show a dash until server info arrives.
- Count represents connections. Backend connection limits, WebSocket protocol and five-message history remain unchanged.
- Frontend typecheck passed. Isolated browser fixtures cover count boundaries, rapid message reception, responsive layout and existing AI/live interactions without sending real messages. See sibling docs/LIVE_CHAT_UI.md.
## 2026-10-13 â€” Firebase customer-to-agent frontend integration

- Added browser-only modular Firebase initialization using public Web config and in-memory authentication. Existing Firebase dependency reused; no Admin credentials or token persistence.
- Added verified GraphQL contracts, JWT-authenticated custom-token exchange, UID/claim checks, fixed-grant renewal before 15-minute expiry, expiry deadline, failure shutdown and serialized sign-out on ANORCAR session changes. Existing login/signup/refresh flow preserved.
- Private Live Chat mode includes customer agent selection/profile entry, backend-owned conversation creation/retrieval, agent/customer inbox discovery, previews, recent realtime messages, older-page pagination, deduplication, chronological ordering, scroll handling, sender IDs/timestamps, validation, submission locks and connection/error/loading states. EN/KR/RU added.
- Community WebSocket room/count retained as a separate mode within the same panel. Gemini untouched. No client membership/index edits, message edits/deletions, backend code/data, dependency installation, commit or deployment.
- Yarn typecheck, authentication regression checks and isolated real-hook chat fixtures passed. Production build passed with 91 pages and lint warnings; a final build after lifecycle refinements is recorded below. Chat fixtures cover successful/failed renewal, UID mismatch, offline sends, inbox/message listeners, history, deduplication, validation and account/session cleanup. Diff check passed.
- Live GraphQL schema check could not reach localhost:3007. Public Web app config was not supplied. Real Firebase sign-in, two-browser exchange/persistence, deployed-rule checks, responsive visual QA and real Gemini/WebSocket regression verification remain manual acceptance steps. No live account/message/database writes were performed.
- No missing inbox backend capability: authorized per-user indexes support discovery. Immediate cross-system revocation remains absent; issued grants can survive account status/role changes elsewhere until expiry (up to 15 minutes). Counterpart display uses member IDs; no unsupported unread receipts/presence feature was added.
- Required config, full file inventory, architecture and manual acceptance checklist: `anorcar-next/docs/FIREBASE_CHAT.md`. Existing handoff location is `anorcar/docs/COMPLETED_TASKS.md` because `docs/ai` is absent.


### Firebase frontend final verification

- Final Yarn production build exited 0 (91 pages; lint/Browserslist warnings). Typecheck, auth and real-hook chat fixtures passed; isolated browser AI/community suite passed at 320/390/768/1440px and EN/KR/RU without provider calls or real messages.
- Correction to the initial handoff: all five required NEXT_PUBLIC_FIREBASE variables are now present/nonempty in ignored frontend .env.local; values were not printed or modified. Live schema validation still could not connect to localhost:3007, including final retry. Real two-account Firebase authentication/messaging and deployed-rule checks remain manual. See sibling anorcar-next/docs/FIREBASE_CHAT.md and FIREBASE_CHAT_COMPLETED.md.
- Temporary local production server stopped. No backend code/data, commit or deployment changes.


## KRW price presentation — 2026-10-13

The user requested replacing USD with Korean won and explicitly chose to preserve numeric values: `$20,000` becomes `₩20,000`. This supersedes earlier USD presentation decisions. No exchange rate, calculation, MongoDB migration or backend changes are involved. Existing stored amounts, filter thresholds, sorting, GraphQL inputs and saved URLs remain unchanged.

`libs/currency.ts` centralizes KRW formatting with the won symbol, separators and zero fractional digits. It normalizes the existing `kr` language key to `ko-KR` and handles missing/nonfinite values as a dash. Zero displays as `₩0`. `libs/carCompare.ts` delegates to this formatter.

Updated homepage cards (popular/top/recent/trending), budget shortcuts and Model Search, Cars grid/list cards and filters, detail prices, shared similar-car cards, My Page cards, add/edit-car price label, admin car price cells and comparison cards/table/picker. EN/KR/RU budget labels and range/input labels now use won/KRW. Budget numeric thresholds remain the same by user instruction.

Updated comparison restoration assertions and the browser browse suite's currency assertion. Existing historical USD reports/demo seed documentation retain their original historical units; this report describes the current display decision.

Validation: Yarn comparison and migration tests passed; phase/final TypeScript and production-build results are recorded below. Search confirms no USD/dollar price labels or formatting remain in active frontend code and translations. No automatic commit/deployment.

Final results: `yarn.cmd typecheck`, `yarn.cmd test:compare`, `yarn.cmd test:migration` and `yarn.cmd build` passed. Production build generated 91 pages, with existing lint/Browserslist warnings. Comparison fixtures verify EN/KR/RU won formatting, zero values and unchanged numeric prices. Browser currency assertion was updated, but the live browser suite was not rerun in this change.


## Comparison page redesign - 2026-10-13

Updated `/car/compare` around the user's reference: three selection positions, a compact control bar, price/mileage/year summaries, grouped specifications and seller/detail actions. Preserved Pages Router, Apollo/GraphQL operations, existing layout/navbar/footer, MUI, SCSS, Poppins typography and KRW numeric-price conventions. No new dependencies or backend/schema/data changes.

Visual direction: white surfaces on `#f6f7f9`, `#181a20` text, `#667080` secondary text, `#e3e7ed` borders and `#e94b20` ANORCAR accents. Existing 34px/25px page-heading standards remain. New selectors are limited to the results route; shared cards/table use optional props so the homepage keeps its current behavior.

The existing URL-based selection/load/retry flow remains. Added the existing searchable/paged picker to this route for add/replace, with duplicate and three-car limits. Removal and Clear All update the URL; selection survives refresh and the share button copies that URL. Clipboard failures explain how to copy the address. Inactive/sold/deleted cars are not accepted as valid comparison results.

Summaries derive only from actual price, reported mileage and model-year fields. Unknown mileage is excluded rather than treated as zero; a mileage difference needs at least two reported values. Specifications preserve all twelve existing fields, grouped as vehicle specifications, powertrain, appearance/location and buying options. Difference filtering and highlighting are independent. Groups can be individually expanded or collapsed, with accessible controls and Expand/Collapse all. No horsepower, engine, equipment or ownership-history data was fabricated.

Seller actions use a telephone link when a phone is supplied, otherwise the existing agent-profile route. Full-detail links retain real listing IDs. EN/KR/RU labels follow existing translation patterns. Mobile stacks cards; specification tables remain horizontally scrollable inside their own regions with no page overflow.

Files: `pages/car/compare.tsx`, `libs/components/car/CompareCarCard.tsx`, `CarComparisonTable.tsx`, new `CompareHighlights.tsx`, `scss/pc/homepage/compare.scss`, new `compare-results.scss`, `public/locales/{en,kr,ru}/common.json`, `scripts/check-compare-results.cjs`, new `scripts/qa-compare-page.cjs` and desktop/mobile screenshots.

Verification: phase TypeScript, existing comparison/restoration tests, rendered results checks and production build passed (91 pages, existing lint/Browserslist warnings). Isolated headless Chrome fixtures passed 1440/768/390/320px, two/three/empty selections, price/mileage summary calculations, difference/highlight controls, groups, picker exclusion/add/remove/replace, URL updates, refresh, clipboard share, Clear All and KR/RU localization. No uncaught browser exceptions, real account operations, GraphQL writes or paid calls. Desktop/mobile screenshots were visually inspected: `docs/screenshots/compare-redesign-1440.png` and `compare-redesign-390.png`. Real inventory content remains subject to backend availability.

No automatic commit or deployment.


## In-page comparison seller chat - 2026-10-13

Replaced comparison seller telephone/profile navigation with `Message seller`. Clicking it opens the existing private Firebase Live Chat on the same page for that listing's agent, with the selected car title above the chat. No message is sent automatically. The optional `Show phone number` / `Hide phone number` control displays the advertised number inline without opening a telephone application.

The existing shared support widget is now enabled on `/car/compare`. Its `anorcar:contact-agent` event supports optional bounded, validated listing context. Context is display-only and is never written as conversation membership or sent as an extra message field. Backend-authorized customer/agent conversations, custom-token sign-in/renewal, realtime history and logout cleanup remain unchanged. Guest users see the existing sign-in link; seller messaging is limited to customer accounts, matching backend permissions. Repeated contact requests can select the intended thread again. Listing context is cleared when the ANORCAR account changes and hidden when another thread is selected.

Closing chat returns focus to the seller action that opened it; ordinary AI/live launchers retain their own focus behavior. Shared profile contact events without listing context still work. Gemini and community chat remain separate.

Changed: `pages/car/compare.tsx`, `libs/components/{Chat,FirebaseChat,SupportChat}.tsx`, `scss/support-chat.scss`, `scss/pc/homepage/compare-results.scss`, EN/KR/RU translations and `scripts/qa-compare-page.cjs`.

Phase TypeScript and existing Firebase lifecycle fixtures passed. The browser suite was extended to check same-page chat opening, the correct car title, guest login, inline phone show/hide and unchanged URL. Final build/browser results are recorded below. No actual messages, accounts, backend schema/data changes, commit or deployment.

Final verification: production build passed with 91 pages and existing lint/Browserslist warnings. Isolated browser tests passed at 1440/768/390/320px and KR/RU: seller button opens the chat with the correct listing title and retains the comparison URL, guest sign-in is offered, phone controls show/hide inline, and existing compare selection/toggles/share/refresh behavior passes. Firebase lifecycle fixtures passed. Authenticated live message exchange was not performed in this change.


## Homepage seller/video showcase - 2026-10-13

Added the requested three-part reference slice directly after Top Agents and before Recently Added Cars in both homepage device branches. Existing NESTAR-derived Pages Router, component folders, layout wrappers, Apollo/GraphQL, MUI and SCSS remain intact. Existing homepage sections and user-uploaded `caraimg19.png` are preserved.

## Presentation

- `SellerShowcase.tsx` uses the supplied `public/img/carimg20.png` with responsive Next Image sizing, a centered accessible play button and an adjacent seller introduction. Existing Poppins, 34px desktop/25px mobile heading conventions, ANORCAR orange buttons, white surfaces and the reference's softly tinted panel are retained.
- Copy describes actual listing/photo, buyer-contact and My Page capabilities. No direct ANORCAR purchase offer, guaranteed valuation, financing, roadside assistance, verification status or invented traffic counts are claimed.
- A four-column metrics row shows live cars for sale, active AGENT accounts, active car brands and the three existing interface languages. The new `GetMarketplaceOverview` document uses existing public queries with page limits of one, fetches metadata/brand IDs only, runs when the section approaches the viewport and uses no-cache to avoid overwriting listing caches. Real zero counts remain zero; failures show dashes and an inline retry.
- Four "Why choose ANORCAR?" items cover search filters, comparison, KRW prices and direct seller contact. EN/KR/RU translations are included. Mobile stacks image/copy, with two-column metrics/benefits and no page overflow.
- Guest Get started leads to existing signup with a clear Agent-role instruction. AGENT List your car opens `/mypage?category=addCar`. Existing signed-in non-agent accounts use Find an agent; no role upgrade or backend permission bypass was introduced.

## Video

Connected [Lamborghini Huracán: Driven by Instinct](https://www.youtube.com/watch?v=Cdh5Taq7H6A), from the official Lamborghini channel. YouTube oEmbed verified the title, author and embeddable-video metadata. The section labels it as a third-party Lamborghini film, not an ANORCAR production or listing video.

The `youtube-nocookie.com` iframe mounts only after Play, inside the existing MUI Dialog pattern. Closing/Escape unmounts it and returns focus to Play. An explicit Watch on YouTube link remains available if embedding is unavailable. No video download, new playback dependency or automatic load before a click.

## Files and verification

Created: `libs/components/homepage/SellerShowcase.tsx`, `scss/pc/homepage/seller-showcase.scss`, `scripts/check-seller-showcase.cjs`, `scripts/qa-seller-showcase.cjs` and this report. Modified: `pages/index.tsx`, `apollo/user/query.ts`, `scss/pc/main.scss`, EN/KR/RU `common.json` files. Supplied `carimg20.png` is referenced without edits.

Phase TypeScript and 91-page production build passed, with existing lint/Browserslist warnings. Live schema validation passed 53 frontend operations, three upload documents and registered enums. The actual overview query returned 15 cars, 15 active agents and one active brand at verification time; these values are not hardcoded in the product.

Component fixtures passed supplied-image/placement, role-specific links, real/empty/error count states and no iframe before a play action. Headless Chrome passed 1440/1024/768/390/320px, KR/RU, correct section order, image loading, no horizontal page overflow, video source/fallback, Escape removal and focus restoration. Video transport was deliberately blocked in browser fixtures; actual playback quality remains subject to YouTube/network policies. oEmbed metadata was checked live. No account operations, paid calls, real messages, backend/data changes, commit or deployment.

Previews visually inspected: `docs/screenshots/home-seller-showcase-1440.png` and `home-seller-showcase-390.png`. Preview metrics are isolated test values; production uses the live overview query. Final TypeScript/build after individual icon-import cleanup are recorded below.

Final results: `yarn.cmd typecheck` and `yarn.cmd build` passed after the import cleanup; build generated all 91 pages with existing warnings. The temporary production preview server was stopped; the user's development frontend/backend were left running. No automatic commit/deployment.



## Homepage promotional refinement - 2026-10-13

# ANORCAR homepage promotional section

## Scope and architecture

Refined the existing `SellerShowcase` between Top Agents and Recently Added Cars in both homepage device branches. Retained Nestar-derived Next Pages Router, React/TypeScript, MUI, scoped SCSS, Apollo, existing GraphQL operations, authentication and EN/KR/RU localization. No new dependencies, routes, schema or database changes. Hero/search, budget, trending, recently added cars, community, navigation, Firebase messaging and AI assistant were not edited. The dedicated comparison page remains separate.

## Presentation and behavior

- The supplied `public/img/carimg21.png` remains a static mountain-road photograph. Removed the unrelated Lamborghini film label, play control, iframe/dialog state and their styles. Next Image uses `fill`, responsive sizes, `object-fit: cover` and `object-position: 50% 75%`. The centered vehicle stays visible. The existing near-viewport observer also changes image loading from lazy to eager when approached, ensuring the image is scheduled at stacked breakpoints without loading it immediately at page startup or adding state. Mobile uses a 1.7 aspect ratio, tablet 1.9.
- A shared rounded card uses two equal columns and a 500px minimum desktop height; both panels stretch equally, with content-driven expansion for longer translations. The container is capped at 1300px. Existing Poppins typography and restrained #171A20/#F04432/#F7F8FA/white styling preserve visual continuity.
- Verified listing creation in `AddNewCar` and the existing My Page menu. Authenticated AGENT accounts see SELL WITH ANORCAR, Your Car. Your Next Buyer., three seller benefits and List Your Car linking to `/mypage?category=addCar`. Guests, customers and admins see DISCOVER ANORCAR, Find a Car That Moves You., three buyer benefits and Explore Cars linking to `/car`. Existing permissions are unchanged.
- Retained the already integrated `GET_MARKETPLACE_OVERVIEW`: existing public car/agent metadata and active brand IDs. No additional requests were added. It still loads near the viewport, with no-cache to avoid partial object cache replacement. Empty results show zero; loading/errors show dashes and an inline retry. Locale count now comes from the existing localization configuration rather than a literal number.
- Metrics spacing and numeric scale are reduced. Four desktop benefits use consistent MUI icons, brief supported descriptions and a two-column compact mobile layout. Mobile CTA fills the content width. No global responsive styles changed.

## Files

`libs/components/homepage/SellerShowcase.tsx`, `scss/pc/homepage/seller-showcase.scss`, `public/locales/{en,kr,ru}/common.json`, the existing `scripts/check-seller-showcase.cjs` and `scripts/qa-seller-showcase.cjs`, this report and refreshed desktop/mobile screenshots.

## Verification

- `yarn.cmd typecheck`: passed.
- `yarn.cmd lint`: passed with existing warnings in unrelated files (legacy img/link usage and React hook dependencies).
- `yarn.cmd node scripts/check-seller-showcase.cjs`: passed, including supplied image, section placement, guest/customer/agent CTA, actual zero counts and error handling.
- Browser checks passed layout/order/image/CTA targets at 1440/1024/768/390/320px. Desktop panel heights are equal and 480-520px; no horizontal overflow; photo has no play controls; all three benefit statements and four overview items remain.
- Initial locale browser run saw cached English resources on the existing development server; a fresh production preview verified Korean/Russian text and Explore Cars navigation. Production browser diagnostics exposed a native lazy-image scheduling issue at the tablet breakpoint; the existing observer now starts image loading near the viewport. Final rerun results are recorded below.

Screenshots use isolated test counts (53 cars, 4 agents, 1 brand, 3 languages); product values are fetched from the existing API. Real account creation, listing publication and message sending were not performed. No commit or deployment.

Final verification: typecheck and 91-page production build passed after the image-loading change. Full production browser checks passed at 1440/1024/768/390/320px, including image loading, aligned desktop panels, three short benefits, no page overflow, EN/KR/RU text and actual Explore Cars navigation. Updated desktop/mobile screenshots were visually inspected. Existing lint/Browserslist warnings and the optional sharp recommendation remain. The temporary preview server was stopped after testing; existing development services remain running.



## Full-width homepage promotional redesign - 2026-10-13

# ANORCAR full-width homepage promotion, statistics and benefits

Inspired by the scale of https://boxcar-nextjs.vercel.app/ while retaining ANORCAR colors, content, permissions and the Nestar-derived architecture.

## Previous constraints and gap

The promotional split was inside `.seller-showcase-container`, capped at 1300px, with 16px rounding and a 500px minimum height. The split now renders outside that container, as a normal 100%-width child of the existing full-width homepage section. No viewport-width hacks or negative margins were added. Statistics and benefits retain a separate 1300px centered wrapper; global homepage containers are unchanged.

The Top Agents showcase imposed `min-height: 816px` plus 132px top/94px bottom padding regardless of actual content. Removed its artificial minimum height and reduced desktop bottom padding to 64px. Existing agent content, carousel, queries and tablet/mobile rules remain. Promotion has no exterior padding, creating a direct dark-to-light transition.

## Layout and supported content

- Desktop promotion: equal 50/50 panels, minimum height clamped between 650px and 750px on large screens, no card rounding. Longer content may expand the row rather than clip. Right panel centers a readable 560px inner column with 64-88px horizontal padding, 44-52px heading, 18px description, 17px benefits and 16px CTA.
- Keep supplied `public/img/carimg21.png`, natural colors and Next Image optimization. Cover positioning is 50% 75%, keeping the centered vehicle visible. Existing viewport observer schedules image loading near the section. Tablet/mobile stack image above copy with 1.8/1.7 aspect ratios, an 80px mobile play control and full-width mobile CTA.
- Listing permissions were rechecked in existing `AddNewCar`: signed-in AGENT accounts receive seller copy and `/mypage?category=addCar`; guests/USER/ADMIN receive buyer copy and `/car`. No permissions, user roles or routes changed.
- Statistics retain the existing Apollo overview query and locale configuration. No new operation or endpoint was added. Live read-only backend verification returned 15 cars, 15 agents and one brand; configured languages are en/kr/ru. Counts are not hardcoded. Existing loading dashes, zero values, error/retry and no-cache behavior remain. Numbers are now 52px, labels 14px, with 72px vertical padding and a subtle divider.
- Why Choose ANORCAR uses the requested four supported capabilities: finding vehicles, comparison, KRW prices and existing private seller messaging. Heading 44px, MUI icons 52px, titles 21px and descriptions 16px. Tablet uses two columns; mobile uses one readable column.
- Order remains Top Agents, promotion, statistics, benefits, Recently Added Cars, community. Removed the old large homepage CompareCars render to retain comparison on its existing dedicated `/car/compare` route; its components, state utilities and dedicated page were preserved.
- Retained Pages Router, React/TypeScript, MUI, SCSS, Apollo, localization and current backend contracts. No new dependencies or backend/schema/data changes. Hero/search, budget, trending, recent listings, agents, auth, navigation, Firebase, community chat and AI assistant logic were not rewritten.

## Video configuration and behavior

`HOME_PROMOTIONAL_VIDEO_URL` in `libs/config.ts` reuses the previously approved https://www.youtube.com/watch?v=Cdh5Taq7H6A. A live YouTube oEmbed check confirmed the title Lamborghini Huracan: Driven by Instinct, author Lamborghini and type video. The UI uses Play video/Automotive video, with no inaccurate manufacturer label on the unrelated photograph.

Optional `NEXT_PUBLIC_HOME_PROMOTIONAL_VIDEO_URL` overrides the default at build time. Empty or unsupported/malformed URLs hide Play. HTTPS YouTube watch/embed and youtu.be URLs are accepted; other hosts and malformed IDs are rejected. Changing a public environment value requires restarting development/rebuilding production; a replacement video must be a real embeddable video.

A 92px white circular button opens the existing MUI Dialog. The youtube-nocookie iframe mounts only while the dialog is open, requests autoplay when permitted, and unmounts immediately on close/Escape to stop playback. Focus returns to Play. A Watch on YouTube fallback remains. Reduced-motion styles disable hover transitions. No video library or automatic iframe loading.

## Files changed in this refinement

- `libs/components/homepage/SellerShowcase.tsx`
- `scss/pc/homepage/seller-showcase.scss`
- `scss/pc/homepage/homepage.scss` (Top Agents minimum-height/bottom-padding only)
- `libs/config.ts` and `.env.example` (video configuration)
- `pages/index.tsx` (remove homepage comparison render)
- `public/locales/{en,kr,ru}/common.json`
- `scripts/check-seller-showcase.cjs`, `scripts/qa-seller-showcase.cjs`
- This report and `docs/screenshots/home-seller-showcase-{1920,1440,390}.png`

## Validation and limits

- `yarn.cmd typecheck`: passed after component changes and final page-order changes.
- `yarn.cmd lint`: passed, with pre-existing warnings for legacy img/link usage and hook dependencies in unrelated files.
- `yarn.cmd build`: passed, all 91 pages generated. Existing Browserslist warnings remain.
- `yarn.cmd node scripts/check-seller-showcase.cjs`: passed supplied image, role-specific copy/CTA, zero/error counts, delayed iframe, approved URL parsing, invalid URL rejection and hidden play for empty configuration.
- `yarn.cmd test:compare`: passed selection, restoration/race handling, localization and unchanged-price KRW checks.
- Production headless Chrome: passed 1920/1440/1024/768/390/320px, including actual Android mobile wrapper, full viewport width, zero section gap, equal desktop panels, 650-750px large-screen height, vehicle image loading, no page overflow, section order, three benefits, correct CTA and real navigation to Cars. Modal embed/fallback, close button, Escape, iframe removal and focus restoration passed. Korean/Russian localization passed.
- Refreshed desktop/mobile screenshots were visually inspected. Screenshot counts (53 cars/4 agents/1 brand/3 languages) are isolated test fixtures; product uses the live API.

YouTube streaming was blocked in browser fixtures; lifecycle and embed source were tested, and live metadata was verified. Actual video delivery/autoplay remains subject to YouTube/network/browser policies. Existing optional sharp recommendation remains; no new dependency was installed. No accounts, listings or messages were created. No automatic commit or deployment. Temporary production preview is stopped after testing; existing development services remain running.



## Homepage final image and benefits refinement - 2026-10-13

## Final composition refinement

Source inspected: unchanged PNG, 1756x896 (1.9598:1). At 1920px the previous image panel was about 952.5x729.6; at 1440px about 712x650. These panel ratios (1.31:1 and 1.10:1) force cover to crop the wide source horizontally. Baseline screenshots at 1920/1440/390 showed the complete car; a bottom-clipped car was not reproduced there. The excessive desktop height still removed more landscape, and the previous mobile ratio cropped the original frame. Bottom anchoring now protects the vehicle/road when a wider panel crops vertically. No image editing, replacement, distortion or extra border/overlay.

Desktop minimum height is now content-safe clamp(620px,35vw,680px): shorter and better balanced, with equal grid rows for both panels. Tablet minimum remains 580px; <=800px uses the source image aspect ratio so the whole photo fits. Play is 84px at 42% height on desktop/tablet, 76px at 40% on mobile, well above the vehicle. A white keyboard outline improves contrast against the landscape; reduced motion and existing modal behavior remain.

Benefits now have their own scoped wrapper capped at the established 1416px width (also used by Top Agents/Recently Added Cars), while statistics retain 1300px. The 52px column / 36px row gaps give desktop features room without narrowing their text. Titles have a minimum two-line area on desktop, so descriptions align naturally across one/two-line headings; this resets on tablet/mobile. No manual line breaks, card borders or content changes. Statistics retain 52px numbers/14px labels, with padding refined from 72px to 68px. Benefits use 64px top/72px bottom padding to transition into Recently Added Cars. Global containers and other sections are unchanged.

Changed in this final pass: SellerShowcase.tsx (benefits wrapper only), seller-showcase.scss, qa-seller-showcase.cjs, this report and before/after screenshots. No GraphQL, auth, CTA, modal, translations, backend or dependency changes.

Before screenshots: home-seller-showcase-before-{1920,1440,390}.png. After screenshots: home-seller-showcase-{1920,1440,390}.png. Isolated screenshot figures remain test fixtures, not production counts. Final validation is recorded below.

Final-pass validation: yarn.cmd typecheck, lint, 91-page production build and existing showcase component/configuration tests passed. Browser checks passed at 1920/1440/1280/1024/768/390/375/320px with real Android mobile wrapper, computed source-to-cover vehicle bounds, no vehicle/button overlap, 76-88px play diameter, equal desktop columns, full-width boundaries, 620-680px large-screen height, 4/2/1-column benefits with desktop gap checks, natural mobile photo aspect, no horizontal overflow, modal close/Escape/unmount/focus, localization and CTA navigation. Desktop and mobile after screenshots were visually inspected against saved before images. Exported after previews hide fixed support launchers only during capture to isolate these sections; product launchers and all functional checks are unchanged. Existing lint/Browserslist and optional sharp warnings remain. Streaming was blocked in browser fixtures; video modal lifecycle was tested. No commit, deployment, data writes or new backend requests. Temporary preview stopped; development services remain running.



## Promotional horizontal and vertical boundary fix - 2026-10-13

## Horizontal and vertical boundary audit

Inspected LayoutHome, navbar rules, #main, .home-page, Top Agents, promotional section/grid/media/copy, margins, padding, overflow and positioning. Measured the running production page at 1920/1024/3440px with 720px viewport height before editing. #main and .home-page have zero margin/padding, full available width and visible overflow. Promotion has zero margin/padding and begins exactly at Top Agents' bottom. Image and copy have identical top/bottom coordinates, with no horizontal panel gap. The navbar is fixed at y=0 with 87px height; it does not reserve additional space inside these sections. Existing Top Agents bottom padding (64px desktop/70px tablet) is deliberate internal spacing, not an external section gap. No navbar/preceding-section offset or margin fix was warranted.

The reproduced top issue is photographic cropping on ultrawide screens. At 3440px viewport (3425px content), media was 1712.5x680. The 1756x896 source scaled to cover that width becomes approximately 1712.5x873.8. Its 100% vertical anchor consequently removes about 193.8 source-rendered pixels from the top, including the mountain peak. At 1920/1024, cover trims horizontally instead; the source car remains centered and visible.

Smallest fix: move the existing source-derived aspect-ratio:1756/896 from the stacked-only breakpoint to the media's base rule, explicitly stretch the grid items, and bind the media width to 100% of its grid column. Grid's automatic row sizing can then grow with the photograph on ultrawide screens, rather than forcing it into a too-short row. The established minimum height and content-driven expansion still apply, and both desktop columns stretch to the same row. Aspect-ratio items use start-like normal alignment in Grid by default; an intermediate test exposed a 31px panel-height mismatch at 2560px, resolved by align-items:stretch. Its automatic inline size could also derive a width from that stretched height and exceed its column; width:100% anchors it to the assigned 50% column. That three-rule combination was verified in an isolated browser before the final build. Object-fit/object-position, global containers, preceding-section spacing, navbar, content, authorization, GraphQL and video logic are unchanged. No new transforms, negative margins, arbitrary offsets, state or dependencies.

Validation is extended to 3440/2560px as well as existing laptop/tablet/mobile widths, with explicit identical panel tops, zero horizontal/external vertical gap and zero vertical image crop. Viewport height is configurable in the QA script for short/tall browser verification. Final measurements/results are recorded below.

Final audit validation: final production CSS (no browser style override) passed all 10 widths 3440/2560/1920/1440/1280/1024/768/390/375/320 at 720px viewport height, then 3440/1920/1024/390 at 1080px height. Tests assert identical panel tops/bottom heights, zero horizontal panel gap, zero external previous-section gap, equal 50% columns, no page overflow, no vertical photo crop, full conservative vehicle bounds, play/car non-overlap, natural stacked image ratio, modal close/Escape/unmount/focus, KR/RU and real Cars CTA navigation. Ultrawide and normal desktop screenshots were visually inspected; the mountain peak and whole car remain visible. Source-based sizing lets the ultrawide row grow to approximately 874px, while 1440/1920 retain 620-680px; no viewport-height clipping is imposed. Final typecheck, component/config tests and 91-page production build passed. Build's existing lint/Browserslist warnings and optional sharp recommendation remain; no new dependency was added. Video streaming was blocked in fixtures, so modal lifecycle/source were tested. The temporary preview server is stopped after testing. No account/data writes, backend/schema changes, commit or deployment.



## Free text listing brands - 2026-10-13

# Free text brand input

Prepared additive GraphQL support for CarInput/CarUpdate.brandName: String. Existing brandId clients remain supported. The agent form now accepts a required text name (1-60 characters) and edit loads the existing brandData name. It no longer depends on the getBrands catalog request.

Backend files staged in .tmp/brand-name-backend/manifest.json: CarInput and CarUpdate DTOs, BrandService.resolveListingBrand, CarService brand resolution and focused DTO/service tests. No schema collections or persisted car relation is replaced. Names reuse existing brand rows case-insensitively, including literal punctuation. Missing names create canonical uppercase catalog names via upsert with the existing unique brandName index and a generic image placeholder. Deleted brands are not reactivated. Updates check active ownership before creating a brand. Admin/agent resolver guards remain unchanged. Both name and ID are rejected when supplied together.

Backend changes were prepared and typechecked before filesystem approval, then applied to the sibling backend workspace. Existing DTO/resolver/service/module organization, AGENT listing guard, ownership checks and MongoDB relationships are preserved.


Validation:
- Frontend TypeScript passed. New rendered-component/validation checks passed for a normal text input, 60-character limit, no getBrands dependency, enabled Save, USER role restriction, name boundaries and legacy IDs.
- Existing migration/auth checks passed, and live schema validation passed 53 frontend GraphQL operations plus three upload documents and enums.
- Backend API and batch TypeScript checks passed; backend production build passed.
- Two backend Jest suites passed, 38 tests: name-only DTOs, missing/invalid names, existing catalog reuse, canonical upsert, literal regex punctuation, deleted-brand rejection, duplicate-key retry, transient name removal, legacy IDs, ambiguous inputs and ownership before brand creation.
- Read-only introspection of the running localhost:3007 API confirms brandName:String and nullable legacy brandId:String for both CarInput and CarUpdate. The development backend loaded the change automatically.

No test accounts, cars or brand records were created in the live database. Service persistence scenarios use model mocks; live mutation publication is left to the normal agent form. New brand names are canonical uppercase; existing brand spelling/logo/status is retained. The generic car placeholder is used until an admin supplies a brand logo. Existing frontend build warnings are unrelated. No automatic commit or deployment.

Final results: frontend production build passed (91 pages) with existing warnings. Isolated Chrome passed 1440px and 390px brand typing for BMW/Toyota/Mercedes-Benz/unlisted names, Save enabled independently of catalog availability, zero GetBrands calls from the form and existing Hyundai edit-name hydration. Browser GraphQL responses were fixtures and no mutations were executed. Frontend and backend builds passed. Temporary preview server stopped after verification; existing development services remain running.


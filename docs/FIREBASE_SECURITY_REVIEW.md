# Firebase backend and Realtime Database rules review — 2026-10-13

Scope: existing private customer-to-agent backend integration and local rules.
No production Firebase requests, rule deployment, frontend modifications, credential
changes or Git commits were performed. Existing uncommitted integration work was preserved.

## Findings and fixes

| Requirement | Finding |
| --- | --- |
| Expiry units | Correct: `chatExpiresAt = Date.now() + 900000`, an integer epoch timestamp in milliseconds. Every client read/write gate uses `chatExpiresAt > now`; Firebase Rules `now` is also milliseconds. Exact/past expiry is denied. JWT `iat`/`exp` remain seconds. |
| Server message timestamps | Compatible: the executable message fixture writes `{ ".sv": "timestamp" }`; the emulator resolves it to numeric epoch milliseconds and accepts `createdAt === now`. Stale, future, string, null and missing timestamps are denied. There is no production Firebase message writer in this backend slice; later frontend implementation must use `serverTimestamp()`, not `Date.now()`. |
| Participant/index ownership | Correct: only trusted Admin operations create conversation metadata and both indexes, after current ACTIVE MongoDB USER/AGENT checks. No client write grant exists for these trees, their parents or their children. Tests deny replacement, deletion, self-enrollment and leaf modifications. |
| Message protection | Correct: only an existing participant with an active grant can append a message. Sender must equal `auth.uid`; messages require three fields, typed/bounded nonblank text and the current server timestamp. Existing-message overwrite, child edits, deletion, unexpected fields and outsider access are denied. |
| Parent-path bypass | No bypass found. Parent PUT/DELETE at root, messages, conversation and index trees is denied. Root PATCH is allowed for a valid new message because each affected path is authorized separately; it cannot modify existing messages, forge a sender or mutate membership. Mixed valid-message/forbidden-metadata updates fail atomically. |
| Authentication/expiration | Consistent with the accepted design: backend mutations use existing JWT guards and current MongoDB status/role checks; Firebase UID comes from the verified member ID. A newly issued Firebase ID token with an old expired grant is still denied. Backend renewal is required; token issue time alone cannot extend the grant. |
| Emulator coverage | Previously present tests covered the main cases but had never run. They now execute successfully and include parent writes, root PATCH, malformed message types, timestamp resolution, expiry/seconds/missing claims, refreshed-token simulation, metadata/index deletion and ASCII/Unicode whitespace. |

One confirmed validation compatibility issue was fixed: official Database Emulator
4.11.2 rejected the original `\s`/`\S` expression with `whitespacechar not found`;
the emulator logged a bundled automaton class serialization mismatch. Firebase's
[documented regex syntax](https://firebase.google.com/docs/database/security/regex)
supports those character sets, so this is not evidence that production Firebase
rejects that syntax. The message rule now uses documented string `replace` operations
to remove explicitly listed whitespace for the nonblank check, preserving multiline
and Unicode text acceptance. All authorization, immutability and timestamp gates remain.
Compilation failures now include the emulator's explanatory response in test output.

Rules only see the resolved timestamp value: numeric equality with `now` does not
prove the caller supplied a server-value placeholder. The supported write contract
uses the placeholder and is tested; permission checks remain independent of timestamp
origin. [Firebase's rules reference](https://firebase.google.com/docs/reference/security/database)
documents the time units and string replacement semantics used here.

## Remaining deployment characteristics

- The Firebase grant expires 15 minutes after backend issuance, independently of the
  remaining ANORCAR JWT lifetime. Firebase custom-token sign-in validity (one hour)
  and JWT `exp` are different from the shorter chat grant.
- Blocking/deleting/changing a member denies subsequent backend requests immediately.
  Existing Firebase grants can continue until their fixed expiry; ANORCAR logout does
  not immediately revoke them. This was already an accepted limitation. Immediate
  account-lifecycle revocation is separate work; future frontend must sign out Firebase.
- The rules suite simulates refreshed ID-token claims; it does not exercise a live
  Firebase Authentication sign-in/refresh exchange. Already-read client data cannot be
  erased by rules expiration. Backend conversation/index partial-failure retry semantics
  remain as documented in FIREBASE_CHAT.md.
- Admin credentials bypass client rules by design. Limit service-account access and
  use only the authorized backend operations. The production Console rules remain
  untouched; the reviewed file must be published manually after review.

## Changed files in this review

- `firebase/database.rules.json` — emulator-compatible nonblank text validation.
- `apps/anorcar-api/src/components/chat/chat.rules.spec.ts` — compile diagnostics and expanded security cases.
- `apps/anorcar-api/src/components/firebase/firebase.spec.ts` — realistic millisecond issuance assertions and custom-token JWT unit/lifetime checks.
- `docs/FIREBASE_CHAT.md`, `docs/COMPLETED_TASKS.md`, `docs/NEXT_STEPS.md` and this report — validation status and findings.

## Test results

- **58 Realtime Database emulator security tests passed**, using official emulator
  4.11.2 bound to `127.0.0.1:19000`, namespace `demo-anorcar-chat`.
- **121 tests passed / 6 suites / 0 skipped**, including those rules tests plus
  Firebase initialization/signing, Chat JWT/service/GraphQL, auth sessions, AI and Inquiry.
- API and batch TypeScript checks passed with `--noEmit --incremental false`.
- `npm.cmd run build` passed; `git diff --check` passed.
- Existing auth failure fixtures emit an expected `Database unavailable` log; Node
  also reports the existing `url.parse()` deprecation. Neither caused test failures.

The emulator and portable Java 21 were downloaded into ignored `.tmp/firebase-review/`
without adding package dependencies or changing machine-wide Java configuration.
The emulator jar's SHA-256 matched the official Firebase CLI download manifest.
The local emulator is stopped after validation.

Reproduce with the Firebase CLI instructions in FIREBASE_CHAT.md, or with the retained
local tooling from the repository root:

```powershell
& '.tmp/firebase-review/java/jdk-21.0.12.1+1-jre/bin/java.exe' '-Duser.language=en' -jar .tmp/firebase-review/database-emulator.jar --host 127.0.0.1 --port 19000
```

In a second terminal:

```powershell
$env:FIREBASE_DATABASE_EMULATOR_HOST = '127.0.0.1:19000'
node node_modules/jest/bin/jest.js --runInBand --silent apps/anorcar-api/src/components/chat apps/anorcar-api/src/components/firebase apps/anorcar-api/src/components/auth/auth-session.spec.ts apps/anorcar-api/src/components/ai/ai.spec.ts apps/anorcar-api/src/components/inquiry/inquiry.spec.ts
Remove-Item Env:FIREBASE_DATABASE_EMULATOR_HOST
```

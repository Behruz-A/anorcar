# Firebase Realtime Database human chat — backend integration

Implemented 2026-10-13. The existing NestJS GraphQL login/signup, MongoDB models,
member roles, shared WebSocket chat and Gemini assistant remain in place. This
adds a separate private customer-to-agent transport; frontend integration is deferred.
Handoff files live in `docs/`, not the absent `docs/ai/` directory.

## File inventory

Created (all paths relative to this repository):

- `apps/anorcar-api/src/components/firebase/firebase.module.ts`, `firebase.service.ts`, `firebase.spec.ts`
- `apps/anorcar-api/src/components/chat/chat.module.ts`, `chat.resolver.ts`, `chat.service.ts`, `chat.spec.ts`, `chat.rules.spec.ts`
- `apps/anorcar-api/src/libs/config/firebase.config.ts`
- `apps/anorcar-api/src/libs/dto/chat/firebase-chat.input.ts`, `firebase-conversation.ts`
- `firebase/database.rules.json`, `firebase/emulator.json`
- `docs/FIREBASE_CHAT.md`

Modified:

- `apps/anorcar-api/src/components/components.module.ts` — register ChatModule.
- `apps/anorcar-api/src/libs/interceptor/Logging.intercepter.ts` — suppress Firebase request/response content.
- `docs/COMPLETED_TASKS.md`, `docs/DECISIONS.md`, `docs/NEXT_STEPS.md` — handoff and activation notes.
- Ignored `.env` — correct only the configured service-account filename.

## Configuration and startup

The already-installed `firebase-admin` dependency is reused. API `ChatModule`
imports a dedicated `FirebaseModule` with a singleton named `anorcar-chat` Admin
app injected into `FirebaseService`. The batch app does not initialize Firebase.

The API requires these backend environment variables at startup:

```dotenv
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_DATABASE_URL=https://your-instance.region.firebasedatabase.app
FIREBASE_SERVICE_ACCOUNT_PATH=secrets/firebase-service-account.json
```

Use the exact root database URL from Firebase Console; `https://your-instance.firebaseio.com`
is also supported. Relative account paths resolve against the API process working
directory; an absolute deployment path also works. The account file must be a readable
service-account JSON with a matching project ID and valid signing credentials.
Missing settings, non-Firebase/non-HTTPS URLs, unreadable/malformed files, project
mismatches and invalid credentials stop API startup with sanitized errors.
No credentials, tokens or chat request/response bodies are logged by the integration.
Keep the JSON in ignored `secrets/` locally; mount it read-only with limited filesystem
access in deployments. Never put these credentials in frontend environment variables.

## Additive GraphQL contract

Every operation uses existing `AuthGuard` and `AuthMember`. Pass the ANORCAR access
JWT via `Authorization: Bearer ...`. The service looks up the current active MongoDB
member rather than trusting role/status snapshots in the JWT.

```graphql
mutation {
  createFirebaseChatToken
}

mutation OpenAgentChat($input: FirebaseConversationInput!) {
  createFirebaseConversation(input: $input) {
    conversationId customerId agentId createdAt
  }
}
# Variables: { "input": { "agentId": "24-character-agent-mongo-id" } }

query AuthorizedConversation($conversationId: String!) {
  getFirebaseConversation(conversationId: $conversationId) {
    conversationId customerId agentId createdAt
  }
}
```

`createFirebaseChatToken` returns a Firebase custom token string. The UID is the
authenticated member's canonical lowercase MongoDB ObjectId. It accepts no input.
Active USER and AGENT members can receive tokens; ADMIN has no chat bypass.
Only an active USER can create a conversation, and the target must be an active AGENT.
Agents reply in existing conversations; no endpoint changes participants.
The query verifies stored membership and the caller's current corresponding role.

Conversation IDs are deterministic `<customerId>_<agentId>`, giving one thread per
pair. A Firebase transaction creates metadata once without overwriting an existing
thread. A subsequent atomic multi-path update writes both user indexes. If this
second operation fails, metadata can temporarily exist without indexes; retrying
the mutation repairs both indexes and preserves the original timestamp/messages.
The backend's Admin SDK bypasses client rules, so service authorization is mandatory.

## Database structure

```text
conversations/{customerId}_{agentId}
  customerId: MongoDB USER ID
  agentId: MongoDB AGENT ID
  createdAt: epoch milliseconds
  participants/{customerId}: true
  participants/{agentId}: true

messages/{conversationId}/{pushMessageId}
  senderId: Firebase auth.uid
  text: nonblank plain text, at most 2000 characters
  createdAt: server timestamp (epoch milliseconds)

userConversations/{uid}/{conversationId}
  otherMemberId: other participant UID
  createdAt: original conversation timestamp
```

Empty messages trees are absent until the first message. No member profile, email,
phone, MongoDB password, credential or token is copied into Firebase. Read/listen
to an individual authorized conversation/message tree and the current user's index.
Do not subscribe to collection roots: rules intentionally deny those reads.
`createdAt` is indexed on each messages tree and user index.

## Rules and session lifetime

Rules are in `firebase/database.rules.json`; they have **not been deployed**.
Everything is denied by default. Metadata/participant/index writes are backend-only.
Messages are append-only, require existing participants, bind senderId to auth.uid,
reject extra fields and require Firebase's server timestamp (`{ ".sv": "timestamp" }`).
Existing message updates/deletes, impersonation, self-enrollment and outsider reads
are denied. Render messages as escaped plain text during the later frontend work.

The custom token contains `anorcarChat: true` and `chatExpiresAt` fixed at issuance
plus 15 minutes. All client reads/writes require both claims and an unexpired chat
grant. Firebase session refresh does not extend that fixed grant. The later frontend
must call the protected token mutation again and `signInWithCustomToken` to renew.
The token is a sign-in credential, not a database bearer ID token; exchange it using
Firebase Authentication, as described in [Firebase custom authentication](https://firebase.google.com/docs/auth/admin/create-custom-tokens).

Blocking/deleting a member or changing a role denies subsequent backend operations
immediately. Already-issued Firebase access can last until its 15-minute grant expires;
ANORCAR logout alone does not revoke a Firebase session. Later frontend work must
sign out Firebase on ANORCAR logout. Immediate cross-system revocation/account hooks
are deferred; production requirements for immediate revocation need a dedicated follow-up.
Rules cannot query MongoDB. [Firebase rules conditions](https://firebase.google.com/docs/database/security/rules-conditions)
describe the auth, participant and validation mechanisms used here.

## Manual Firebase Console setup

1. Select the Firebase project matching the environment and service account. Create
   Realtime Database if absent; choose locked mode and copy its instance URL.
2. Initialize Firebase Authentication (Get started) for custom-token sign-in. No
   anonymous/email/password provider is required for this bridge; keep ANORCAR login/signup.
3. Ensure the backend service account can access that database. Restrict who can
   read the credential file and administer the project; do not distribute the JSON.
4. Review and test `firebase/database.rules.json`, then paste it into **Realtime
   Database → Rules** for the configured instance and publish manually. This root
   ruleset is intended for the chat database; review any existing unrelated data/rules
   before replacing an existing ruleset. Never enable test-mode/public access.
5. Restart the API after configuring the environment. Frontend SDK/configuration,
   sign-in/renewal/logout and private conversation UI are a separate later phase.

## Validation

Initial integration results: 26 new backend tests passed; 63 passed including existing
auth, AI and Inquiry regressions. The original nine emulator cases were skipped then.
The subsequent security review executed and expanded those tests: **58 emulator security
tests and 121 tests overall passed, with no skips**. API/batch TypeScript checks and Nest
build passed. Rules remain undeployed. See [FIREBASE_SECURITY_REVIEW.md](FIREBASE_SECURITY_REVIEW.md)
for the emulator regex compatibility fix, exact findings and remaining deployment characteristics.
Local configured credential validation used no network calls. The ignored `.env` account
path was corrected during integration; credentials were neither printed nor modified.

Backend service/config/GraphQL tests use local signing fixtures and isolated storage,
never the real service account, paid APIs or a live Firebase/MongoDB write:

```powershell
node node_modules/jest/bin/jest.js --runInBand apps/anorcar-api/src/components/chat apps/anorcar-api/src/components/firebase
node node_modules/typescript/bin/tsc -p apps/anorcar-api/tsconfig.app.json --noEmit --incremental false
node node_modules/typescript/bin/tsc -p apps/anorcar-batch/tsconfig.app.json --noEmit --incremental false
npm.cmd run build
```

Rules tests require a Java runtime and Firebase CLI installed separately. From the
repository root, start **only the local demo emulator**:

```powershell
firebase emulators:start --only database --project demo-anorcar-chat --config firebase/emulator.json
```

In a second terminal:

```powershell
$env:FIREBASE_DATABASE_EMULATOR_HOST = '127.0.0.1:9000'
node node_modules/jest/bin/jest.js --runInBand apps/anorcar-api/src/components/chat/chat.rules.spec.ts
Remove-Item Env:FIREBASE_DATABASE_EMULATOR_HOST
```

The opt-in suite installs rules and resets data **only in its local demo namespace**.
It covers both participants, outsiders/anonymous/expired claims, collection reads,
indexes, metadata changes, sender spoofing, malformed messages, append-only behavior
and atomic participant escalation. It skips when the emulator variable is absent
and refuses non-loopback hosts. No CLI deploy command is included.

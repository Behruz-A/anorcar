# Backend Migration: NESTAR to ANORCAR

## Current status

The completed work is a safe branding and workspace rename. The repository is now named ANORCAR, but its business domain remains the original real-estate domain. A Property-to-Car domain migration is proposed work and has not been implemented.

| Area | Original state | Current state |
| --- | --- | --- |
| Package | `nestar` | `anorcar` |
| API application | `apps/nestar-api` | `apps/anorcar-api` |
| Batch application | `apps/nestar-batch` | `apps/anorcar-batch` |
| Nest project keys | `nestar-api`, `nestar-batch` | `anorcar-api`, `anorcar-batch` |
| Prompt snapshot | `NESTAR_AI_PROMPT.md` | `ANORCAR_AI_PROMPT.md` |
| Business domain | Real-estate properties and agents | Unchanged |

## Original project summary

NESTAR was a NestJS monorepo with two applications:

- An Apollo GraphQL API using MongoDB through Mongoose, JWT authentication, validation, uploads, and WebSockets.
- A scheduled batch application that recalculates property and agent ranking values.

The API contains authentication, members, properties, board articles, comments, likes, views, follows, notifications/notices, uploads, and socket functionality.

## New project summary

ANORCAR retains the same NestJS architecture and runtime behavior. Application paths, Nest workspace identifiers, package metadata, production entry paths, internal imports, the REST welcome message, batch identifiers, and documentation branding now use ANORCAR names.

The following modules remain in service without business-logic changes:

| Subsystem | Current responsibility |
| --- | --- |
| Auth and Member | Registration, login, JWT authorization, profiles, agents, and admin operations |
| Property | Property creation, search, updates, favorites, visits, likes, and administration |
| Board Article | Community article CRUD, likes, search, and administration |
| Comment | Comments for supported target groups and counter updates |
| Like and View | Generic engagement records and property/member/article integration |
| Follow | Member follower/following relationships |
| Socket | WebSocket connection and messaging behavior |
| Batch | Property and agent rank recalculation |

## Backend migration goal

The completed goal was to establish ANORCAR project identity without changing public contracts or persisted data. The future goal is to convert the real-estate platform into a car marketplace by replacing Property concepts with Car concepts and Agent concepts with Dealer concepts. That future migration requires an approved data model and coordinated backend/frontend rollout.

## Completed naming changes

- Renamed both application directories and Nest project keys.
- Updated `nest-cli.json`, application TypeScript output paths, package scripts, production paths, and cross-application imports.
- Changed package and lockfile names to `anorcar`.
- Changed the API welcome text to `Welcome to Anorcar REST API Server!`.
- Renamed the batch module symbol and branding-bearing test descriptions.
- Renamed and rebranded the retained AI prompt snapshot.
- Corrected stale e2e application paths and incompatible `supertest` imports needed for type checking.

## GraphQL compatibility

No GraphQL type, enum, field, query, mutation, argument, or response shape changed. Current property operations include:

- `createProperty`, `getProperty`, `updateProperty`, and `getProperties`
- `getFavorites` and `getVisited`
- `getAgentProperties` and `likeTargetProperty`
- `getAllPropertiesByAdmin`, `updatePropertyByAdmin`, and `removePropertyByAdmin`

Member, article, comment, follow, upload, and admin operations also remain unchanged. Existing frontend clients should continue using the Property contract until a separately approved Car contract is deployed.

## MongoDB compatibility

No Mongoose schema, model registration name, document field, enum value, index, or collection name changed.

| Model | Collection |
| --- | --- |
| Property | `properties` |
| Member | `members` |
| BoardArticle | `boardArticles` |
| Comment | `comments` |
| Like | `likes` |
| View | `views` |
| Follow | `follows` |
| Notice | `notices` |
| Notification | `notifications` |

`PROPERTY` remains present in comment, like, view, and notification groups. `AGENT` remains a `MemberType`. Property fields such as `propertySquare`, `propertyBeds`, and `propertyRooms` are still active.

## Deployment and compatibility notes

- Environment keys remain `PORT_API`, `PORT_BATCH`, `MONGO_DEV`, `MONGO_PROD`, and `SECRET_TOKEN`.
- Deployment commands must use `dist/apps/anorcar-api/main` and `dist/apps/anorcar-batch/main`.
- Tooling or infrastructure that names the old application directories must be updated even though the runtime API is compatible.
- Do not rename Property GraphQL operations, Mongo collections, enum values, or member roles until frontend usage and data migration requirements are known.
- A future breaking migration should use an explicit compatibility window or a coordinated release; it must not be inferred from the completed branding rename.


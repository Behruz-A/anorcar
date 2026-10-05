# Backend Migration: NESTAR to ANORCAR

## Current status

The branding migration and the breaking Property-to-Car backend migration are complete. ANORCAR now exposes a Car/Brand marketplace contract while preserving the existing member roles and reusable community modules.

| Area | Original state | Current state |
| --- | --- | --- |
| Package | `nestar` | `anorcar` |
| API application | `apps/nestar-api` | `apps/anorcar-api` |
| Batch application | `apps/nestar-batch` | `apps/anorcar-batch` |
| Nest project keys | `nestar-api`, `nestar-batch` | `anorcar-api`, `anorcar-batch` |
| Prompt snapshot | `NESTAR_AI_PROMPT.md` | `ANORCAR_AI_PROMPT.md` |
| Business domain | Real-estate properties and agents | Cars and brands; `AGENT` remains the seller role |

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

## Backend migration result

The backend now uses Car terminology throughout GraphQL, Mongoose, engagement integrations, member counters, and batch ranking. The migration intentionally keeps `MemberType.USER | AGENT | ADMIN`; no Dealer member type was introduced.

## Completed naming changes

- Renamed both application directories and Nest project keys.
- Updated `nest-cli.json`, application TypeScript output paths, package scripts, production paths, and cross-application imports.
- Changed package and lockfile names to `anorcar`.
- Changed the API welcome text to `Welcome to Anorcar REST API Server!`.
- Renamed the batch module symbol and branding-bearing test descriptions.
- Renamed and rebranded the retained AI prompt snapshot.
- Corrected stale e2e application paths and incompatible `supertest` imports needed for type checking.

## GraphQL contract

This was a coordinated breaking change with no Property compatibility aliases. Car operations include:

- `createCar`, `getCar`, `updateCar`, and `getCars`
- `getFavorites` and `getVisited`
- `getAgentCars` and `likeTargetCar`
- `getAllCarsByAdmin`, `updateCarByAdmin`, and `removeCarByAdmin`
- public Brand queries plus admin Brand creation, update, listing, and soft deletion

`getFavorites` and `getVisited` retain their names but return `Cars`. Frontend consumers must use the new breaking contract.

## MongoDB model

The active catalog is stored in new `cars` and `brands` collections. No data conversion runs because the approved migration assumes no production Property data; the old `properties` collection is left untouched for manual rollback.

| Model | Collection |
| --- | --- |
| Car | `cars` |
| Brand | `brands` |
| Member | `members` |
| BoardArticle | `boardArticles` |
| Comment | `comments` |
| Like | `likes` |
| View | `views` |
| Follow | `follows` |
| Notice | `notices` |
| Notification | `notifications` |

Engagement and notification groups use `CAR`. Members store `memberCars`; `AGENT` remains the ownership role.

## Deployment and compatibility notes

- Environment keys remain `PORT_API`, `PORT_BATCH`, `MONGO_DEV`, `MONGO_PROD`, and `SECRET_TOKEN`.
- Deployment commands must use `dist/apps/anorcar-api/main` and `dist/apps/anorcar-batch/main`.
- Tooling or infrastructure that names the old application directories must be updated even though the runtime API is compatible.
- Do not delete the old `properties` collection automatically; rollback remains an explicit operational action.
- Frontend deployment must be coordinated with this breaking GraphQL contract.


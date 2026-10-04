# Proposed Next.js Frontend Migration

> Status: proposed. No Next.js frontend is present in this workspace. All example paths and component names must be verified against the frontend repository before editing.

## Migration sequence

1. Inventory the frontend routes, components, generated GraphQL types, hooks, cache policies, environment variables, and visible NESTAR strings.
2. Apply ANORCAR branding while continuing to call the existing Property GraphQL API.
3. Create an API-usage matrix linking every Property query/mutation to its pages and components.
4. Agree on the backend Car schema, compatibility policy, and deployment sequence.
5. Add Car GraphQL documents and regenerate frontend types without removing Property documents.
6. Migrate one route group at a time: browse, detail, create/edit, profile inventory, favorites/visited, then admin.
7. Verify cache updates, authentication, uploads, filters, pagination, errors, and SEO metadata.
8. Remove Property compatibility only after repository-wide usage checks and production telemetry confirm zero consumers.

## Proposed page and component mapping

| Existing NESTAR concept | Proposed ANORCAR concept | Example target name; verify path |
| --- | --- | --- |
| Property listing page | Car marketplace page | `/cars`, `CarListPage` |
| Property detail page | Car detail page | `/cars/[carId]`, `CarDetailPage` |
| Create property page | Create car listing page | `/cars/create`, `CreateCarPage` |
| Edit property page | Edit car listing page | `/cars/[carId]/edit`, `EditCarPage` |
| Agent directory | Dealer directory | `/dealers`, `DealerListPage` |
| Agent profile | Dealer profile | `/dealers/[dealerId]`, `DealerProfilePage` |
| Agent properties | Dealer inventory | `DealerInventory` |
| Property card/grid | Car card/grid | `CarCard`, `CarGrid` |
| Property filters | Vehicle filters | `CarFilters` |
| Favorite properties | Favorite cars | `/account/favorites` |
| Visited properties | Recently viewed cars | `/account/recently-viewed` |
| Admin properties | Admin car inventory | `/admin/cars` |

## UI terminology mapping

| Current term | Proposed term |
| --- | --- |
| NESTAR | ANORCAR |
| Property / Properties | Car / Cars |
| Agent / Agents | Dealer / Dealers |
| Property type | Body type |
| Property location/address | Car location/seller address |
| Constructed date | Model year |
| Square area | Mileage |
| Beds | Fuel type |
| Rooms | Transmission |
| Sold property | Sold car |

These field mappings communicate product intent, not an approved backend schema. Exact types and enum values must be finalized in the backend Car contract first.

## GraphQL operation rename plan

| Current operation | Proposed operation | Consumer areas |
| --- | --- | --- |
| `createProperty` | `createCar` | Create listing form |
| `getProperty` | `getCar` | Detail and edit pages |
| `updateProperty` | `updateCar` | Edit listing and status actions |
| `getProperties` | `getCars` | Browse, search, and home sections |
| `getFavorites` | `getFavoriteCars` | Account favorites |
| `getVisited` | `getVisitedCars` | Recently viewed list |
| `getAgentProperties` | `getDealerCars` | Dealer profile and account inventory |
| `likeTargetProperty` | `likeTargetCar` | Favorite/like actions |
| `getAllPropertiesByAdmin` | `getAllCarsByAdmin` | Admin inventory |
| `updatePropertyByAdmin` | `updateCarByAdmin` | Admin moderation |
| `removePropertyByAdmin` | `removeCarByAdmin` | Admin deletion |

### Rollout phases

1. **Compatibility phase:** retain all current Property operations while branding and UI copy change.
2. **Parallel contract phase:** backend introduces Car operations; frontend adds documents, hooks, and generated types alongside Property equivalents.
3. **Consumer migration phase:** migrate pages individually and update tests, cache policies, and analytics names.
4. **Removal phase:** remove Property operations only after code search, logs, and deployed-client checks show no remaining use.

## Frontend technical checklist

- Replace brand assets, document titles, Open Graph data, structured metadata, navigation labels, and empty/error-state copy.
- Update route names and redirects while preserving old URLs during the compatibility window.
- Replace Apollo cache keys and update functions from Property to Car only when Car `__typename` values exist.
- Regenerate GraphQL types after schema changes; do not hand-edit generated files.
- Redesign forms and filters around approved vehicle fields, with validation matching backend DTOs.
- Keep image upload transport and authentication headers unchanged unless the backend contract explicitly changes.
- Map `AGENT` authorization to `DEALER` only after backend role compatibility is available.
- Test loading, empty, unauthorized, validation, network, deleted, and sold states on every migrated page.
- Preserve a feature flag or deployable previous frontend build until the Car contract is stable.


---
name: product-logic
description: Review Anorcar product API consistency across GraphQL operations, DTOs, schemas, enums, filters, and remaining legacy terminology.
---

# Anorcar Product API Review

Use this skill for review-only passes or pre-edit analysis of the product API.

## Review Checklist

- Confirm GraphQL operation names use product terminology:
  - `createProduct`
  - `getProduct`
  - and where it is related
- Confirm shared operations such as `getFavorites` and `getVisited` return product data.
- Confirm DTOs, schemas, and enums agree on product fields and nullability.
- Confirm filters use carTransmission, carFuelTypes, condition, price and etc.
- Report real findings with paths and behavior impact.

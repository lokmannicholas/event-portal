# Event Portal Repository

This repository contains two standalone applications:

- `apps/event-portal` — unified Next.js frontend for EAP admin routes, ECP group routes, and ERP public routes
- `apps/strapi` — Strapi 5 TypeScript backend with schemas, portal APIs, and booking workflow stubs

It follows the confirmed portal split and scheduling / booking model from the requirement and technical-spec draft:
- three route areas inside the unified frontend: EAP, ECP, ERP
- user partition and user group based access
- template → generated event → appointment workflow
- released / active / disabled / closed event lifecycle
- hold-based quota booking for ERP
- contact info and document publishing per portal

## Project structure

```text
apps/
  event-portal/  Standalone Next.js frontend for admin, client, and public routes
  strapi/        Standalone Strapi 5 CMS / API / workflows
docs/
  solution-overview.md
  strapi-schema-overview.md
```

## Technology choices

The frontends are generated as **Next.js + TypeScript** apps because the earlier confirmed direction was a Next.js project, while still satisfying the request for React + TypeScript frontends. Strapi 5 is used for the backend data model and custom workflow endpoints.

Package versions are intentionally pinned at **major-version ranges** instead of exact latest patches because this environment could not verify current registry metadata during generation.

## Key implemented backend entities

Strapi collection types:

- `user-partition`
- `user-group`
- `portal-user`
- `mandatory-field`
- `event-template`
- `event`
- `event-date`
- `event-slot`
- `appointment`
- `appointment-hold`
- `portal-document`
- `contact-info`
- `audit-log`

Strapi components:

- `form.field-config`
- `notification.template-message`

## Portal API surface

Custom Strapi portal routes are scaffolded in `apps/strapi/src/api/portal/*` for:

- EAP dashboard / management read models
- ECP event listing and event detail
- ERP partition landing, event detail, hold creation, booking, enquiry, and cancellation
- management actions for template generation, event release, and appointment cancellation

## What is production-ready vs scaffolded

Implemented as a solid scaffold:

- repo structure
- Strapi content schemas
- portal read endpoints
- booking / hold / cancellation workflow skeleton
- background job skeletons
- frontend navigation, views, and typed data clients
- ERP interactive registration form with hold timer

Still needs project-specific integration work before go-live:

- real authentication / authorization policies
- Excel report binary export
- full admin CRUD forms and validation rules
- transaction-safe locking strategy for high-concurrency booking

## Local startup

### 1) Start Postgres

```bash
docker compose up -d postgres
```

### 2) Install dependencies

```bash
cd apps/strapi && yarn install
cd ../event-portal && yarn install
```

### 3) Start Strapi

```bash
cp .env.example apps/strapi/.env
cd apps/strapi && yarn develop
```

### 4) Start the frontend

```bash
cd apps/event-portal && yarn dev
```

## Environment variables

Use the root `.env.example` as the base and copy portal-specific values into each frontend or into your shell environment.

Important variables:

- `STRAPI_API_BASE_URL`
- `NEXT_PUBLIC_STRAPI_URL`
- `STRAPI_API_TOKEN`
- `STRAPI_READ_TOKEN`
- `SENDGRID_ENABLED`
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `SENDGRID_FROM_NAME`
- `SENDGRID_REPLY_TO_EMAIL`
- `SENDGRID_REPLY_TO_NAME`
- `SMS_SENDER_ENABLED`
- `SMS_SENDER_URL`
- `SMS_SENDER_API_KEY`
- `SMS_SENDER_API_SECRET`

SendGrid email defaults and SMS sender defaults can be overridden from the Strapi admin settings UI.

## Notes

- Group-scoped client users enter through paths such as `/ecp/HSBC-HR`.
- The public partition landing route is `/p/[partitionCode]`.
- The public event detail route is `/p/[partitionCode]/e/[eventCode]`.
- Non-auth Strapi requests from EAP use `Authorization: Bearer <jwt>` from the signed login session cookie.
- If there is no signed portal session yet, EAP falls back to `STRAPI_API_TOKEN` or `STRAPI_READ_TOKEN` when available.
- `POST /api/auth/local` is the one login path that does not send the API token.

# Solution overview

## Decision summary

This implementation uses a monorepo with one Strapi backend and three React frontends:

- EAP for QHMS admin users
- ECP for client HR users
- ERP for public participants

The portals are generated as separate Next.js applications so each portal can evolve independently while sharing contracts and UI primitives.

## Data ownership

Strapi owns:

- partitions
- groups
- users-permissions users
- template field library
- event templates
- events and slot schedules
- appointments and holds
- portal documents
- contact information
- audit logs

## Read model strategy

The frontends do not couple themselves directly to raw Strapi entity payloads. They consume custom portal-oriented DTOs returned by the `/api/portal/*` endpoints.

That keeps the frontends stable even if Strapi entity internals change later.

## Workflow summary

1. EAP creates or updates field definitions.
2. EAP creates an event template.
3. EAP generates an event from the template.
4. EAP edits the event and releases it.
5. ERP users visit a partition landing page, reserve a slot hold, and submit a booking.
6. EAP and ECP view the same appointment data.
7. ERP / EAP / ECP can cancel an appointment, which releases capacity and keeps audit history.

## Important implementation assumptions

- Released events can appear in the public portal once the registration window is open.
- Only one active booking per participant per event is accepted.
- Template generation creates an event snapshot.
- Cancellations are history-preserving rather than hard-deleting appointments.

## Remaining integration tasks

- replace mock fallback data with live auth-bound data
- wire email and SMS providers
- add upload / download hardening
- add row-level access policies
- add Excel export and printable QR workflows

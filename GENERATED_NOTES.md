# Generated notes

This repository was generated from the event portal requirement and the confirmed technical-spec draft.

## Included

- three Next.js TypeScript frontends:
  - EAP
  - ECP
  - ERP
- one Strapi 5 TypeScript backend
- Strapi content types for the core business entities
- portal-oriented Strapi route/controller/service scaffold
- ERP interactive hold + booking + enquiry UI
- shared contracts and sample fixtures
- shared UI primitives
- root documentation and local startup files

## Important follow-up work

- connect authentication and authorization to real Strapi or SSO policies
- replace stub notification provider with production email / SMS integrations
- add DB transactions / row locking for high-volume slot booking
- implement upload workflows, QR image generation, and binary Excel export
- add validation, testing, and deployment configuration

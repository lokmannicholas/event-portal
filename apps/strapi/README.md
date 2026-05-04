# Strapi 5 backend

This app contains:

- content-type schemas for the event portal
- component schemas for form fields and notification templates
- portal-oriented read endpoints for EAP / ECP / ERP
- booking workflow stubs for hold, booking, enquiry, and cancellation
- cron task skeletons for hold expiry, event status transitions, and reminders

The implementation intentionally keeps the portal DTO mapping in custom services so the frontends do not depend on raw Strapi entity shapes.

# Strapi 5 backend

This app contains:

- content-type schemas for the event portal
- component schemas for form fields and notification templates
- portal-oriented read endpoints for EAP / ECP / ERP
- booking workflow stubs for hold, booking, enquiry, and cancellation
- cron task skeletons for hold expiry, event status transitions, and reminders
- a `sendgrid-email` plugin for SendGrid-backed email delivery plus runtime settings overrides
- an `sms-sender` plugin for REST-backed SMS delivery plus runtime settings overrides

The implementation intentionally keeps the portal DTO mapping in custom services so the frontends do not depend on raw Strapi entity shapes.

## SendGrid configuration

The Strapi app now loads SendGrid defaults from environment variables and lets Strapi admins override them from the Strapi admin settings UI.

Supported env vars:

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

The manual notice send flow continues to store a `Notice` record before delivery is attempted, so failed email and SMS sends remain visible in notice history.

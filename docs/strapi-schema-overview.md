# Strapi schema overview

## Core access model

### User Partition
Public partition scope used by shared QR code / public URL.

### User Group
Controls EAP or ECP access and links users to partitions.

### Users-Permissions User
Represents an internal users-permissions user and links to a user group for EAP or ECP access.

## Event model

### Custom Field
Reusable field definition library used by template builders.

### Event Template
Reusable definition of content, date defaults, registration dates, quotas, and dynamic fields.

### Event
Generated event snapshot released to portals.

### Event Date
One date row within an event.

### Event Slot
One time slot row under an event date.

## Booking model

### Appointment Hold
Temporary capacity reservation during ERP registration.

### Appointment
Confirmed or cancelled booking record with participant snapshot fields.

## Content model

### Portal Document
Uploaded file with target portals and optional partition scope.

### Contact Info
Portal-visible support content with optional partition scope.

### Audit Log
Change history for bookings and event operations.

## Components

### form.field-config
Snapshot of one field in a template or event schema.

### notification.template-message
Per-event confirmation / reminder / cancellation template item by channel and language.

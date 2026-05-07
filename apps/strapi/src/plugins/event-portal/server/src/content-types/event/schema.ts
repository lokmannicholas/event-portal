export default {
  "kind": "collectionType",
  "collectionName": "events",
  "info": {
    "singularName": "event",
    "pluralName": "events",
    "displayName": "Event",
    "description": "Generated event registration form and live appointment configuration"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "companyName": {
      "type": "string",
      "required": true
    },
    "companyNameZh": {
      "type": "string"
    },
    "location": {
      "type": "string",
      "required": true
    },
    "locationZh": {
      "type": "string"
    },
    "eventName": {
      "type": "string",
      "required": true
    },
    "eventNameZh": {
      "type": "string"
    },
    "eventDescription": {
      "type": "text"
    },
    "eventDescriptionZh": {
      "type": "text"
    },
    "eventNotes": {
      "type": "text"
    },
    "eventNotesZh": {
      "type": "text"
    },
    "eventStatus": {
      "type": "enumeration",
      "enum": [
        "DRAFT",
        "RELEASED",
        "DISABLED",
        "CLOSED"
      ],
      "default": "DRAFT"
    },
    "eventStartDate": {
      "type": "date",
      "required": true
    },
    "eventEndDate": {
      "type": "date",
      "required": true
    },
    "dayStartTime": {
      "type": "time",
      "required": true
    },
    "dayEndTime": {
      "type": "time",
      "required": true
    },
    "registrationStartDate": {
      "type": "date",
      "required": true
    },
    "registrationEndDate": {
      "type": "date",
      "required": true
    },
    "reminderOffsetDays": {
      "type": "integer",
      "default": 2
    },
    "publicSlug": {
      "type": "uid",
      "targetField": "eventName"
    },
    "publishedToPortals": {
      "type": "boolean",
      "default": false
    },
    "showInRegistrationPeriod": {
      "type": "boolean",
      "default": true
    },
    "showInEventPeriod": {
      "type": "boolean",
      "default": true
    },
    "showInExpired": {
      "type": "boolean",
      "default": false
    },
    "releasedAt": {
      "type": "datetime"
    },
    "publicBaseUrl": {
      "type": "string"
    },
    "smsRegistrationNoticeTemplate": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::event-portal.notice-template"
    },
    "smsAnnouncementNoticeTemplate": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::event-portal.notice-template"
    },
    "smsEventUpdateNoticeTemplate": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::event-portal.notice-template"
    },
    "emailRegistrationNoticeTemplate": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::event-portal.notice-template"
    },
    "emailAnnouncementNoticeTemplate": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::event-portal.notice-template"
    },
    "emailEventUpdateNoticeTemplate": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::event-portal.notice-template"
    },
    "userPartition": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::event-portal.user-partition",
      "inversedBy": "events"
    },
    "template": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::event-portal.event-template",
      "inversedBy": "events",
      "required": true
    },
    "slots": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "plugin::event-portal.event-slot",
      "mappedBy": "event"
    },
    "appointments": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "plugin::event-portal.appointment",
      "mappedBy": "event"
    },
    "holds": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "plugin::event-portal.appointment-hold",
      "mappedBy": "event"
    },
    "auditLogs": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "plugin::event-portal.audit-log",
      "mappedBy": "event"
    }
  }
};

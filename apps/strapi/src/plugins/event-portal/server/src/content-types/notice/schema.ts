export default {
  "kind": "collectionType",
  "collectionName": "notices",
  "info": {
    "singularName": "notice",
    "pluralName": "notices",
    "displayName": "Notice",
    "description": "Rendered and delivered participant notices"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "channel": {
      "type": "enumeration",
      "enum": [
        "EMAIL",
        "SMS"
      ],
      "required": true
    },
    "recipient": {
      "type": "string",
      "required": true
    },
    "subject": {
      "type": "string"
    },
    "plainTextBody": {
      "type": "text",
      "required": true
    },
    "htmlBody": {
      "type": "richtext"
    },
    "noticeStatus": {
      "type": "enumeration",
      "enum": [
        "PENDING",
        "SENT",
        "FAILED"
      ],
      "default": "PENDING"
    },
    "errorMessage": {
      "type": "text"
    },
    "sentAt": {
      "type": "datetime"
    },
    "noticeTemplate": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::event-portal.notice-template",
      "inversedBy": "notices"
    },
    "appointment": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::event-portal.appointment"
    },
    "event": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::event-portal.event"
    }
  }
};

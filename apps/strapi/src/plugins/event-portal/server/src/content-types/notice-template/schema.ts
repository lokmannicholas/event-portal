export default {
  "kind": "collectionType",
  "collectionName": "notice_templates",
  "info": {
    "singularName": "notice-template",
    "pluralName": "notice-templates",
    "displayName": "Notice Template",
    "description": "Reusable email and SMS notice templates"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "name": {
      "type": "string",
      "required": true
    },
    "description": {
      "type": "text"
    },
    "channel": {
      "type": "enumeration",
      "enum": [
        "EMAIL",
        "SMS"
      ],
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
    "active": {
      "type": "boolean",
      "default": true
    },
    "sortOrder": {
      "type": "integer",
      "default": 0
    },
    "notices": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "plugin::event-portal.notice",
      "mappedBy": "noticeTemplate"
    }
  }
};

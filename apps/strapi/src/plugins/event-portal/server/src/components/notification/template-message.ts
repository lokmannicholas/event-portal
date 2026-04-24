export default {
  "collectionName": "components_notification_template_messages",
  "info": {
    "displayName": "template-message",
    "description": "Per-event notice template mapping by notice type"
  },
  "options": {},
  "attributes": {
    "templateType": {
      "type": "enumeration",
      "enum": [
        "REGISTRATION",
        "ANNOUNCEMENT",
        "EVENT_UPDATE"
      ],
      "required": true
    },
    "noticeTemplate": {
      "type": "relation",
      "relation": "oneToOne",
      "target": "plugin::event-portal.notice-template"
    },
    "enabled": {
      "type": "boolean",
      "default": true
    }
  }
};

export default {
  "kind": "collectionType",
  "collectionName": "event_templates",
  "info": {
    "singularName": "event-template",
    "pluralName": "event-templates",
    "displayName": "Event Template",
    "description": "Reusable blueprint used to generate event snapshots"
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
    "eventTemplateStatus": {
      "type": "enumeration",
      "enum": [
        "ACTIVE",
        "ARCHIVED"
      ],
      "default": "ACTIVE"
    },
    "userPartitions": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "plugin::event-portal.user-partition",
      "mappedBy": "template"
    },
    "formFields": {
      "type": "component",
      "repeatable": true,
      "component": "event-portal.field-config"
    },
    "events": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "plugin::event-portal.event",
      "mappedBy": "template"
    }
  }
};

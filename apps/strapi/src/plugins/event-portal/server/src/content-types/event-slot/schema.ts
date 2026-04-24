export default {
  "kind": "collectionType",
  "collectionName": "event_slots",
  "info": {
    "singularName": "event-slot",
    "pluralName": "event-slots",
    "displayName": "Event Slot",
    "description": "Timeslot row under an event"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "eventDate": {
      "type": "date",
      "required": true
    },
    "startTime": {
      "type": "time",
      "required": true
    },
    "endTime": {
      "type": "time",
      "required": true
    },
    "enabled": {
      "type": "boolean",
      "default": true
    },
    "quota": {
      "type": "integer",
      "required": true
    },
    "usedCount": {
      "type": "integer",
      "default": 0
    },
    "holdCount": {
      "type": "integer",
      "default": 0
    },
    "sortOrder": {
      "type": "integer",
      "default": 0
    },
    "event": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::event-portal.event",
      "inversedBy": "slots",
      "required": true
    },
    "appointments": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "plugin::event-portal.appointment",
      "mappedBy": "eventSlot"
    },
    "holds": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "plugin::event-portal.appointment-hold",
      "mappedBy": "eventSlot"
    }
  }
};

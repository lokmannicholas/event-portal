export default {
  "kind": "collectionType",
  "collectionName": "appointment_holds",
  "info": {
    "singularName": "appointment-hold",
    "pluralName": "appointment-holds",
    "displayName": "Appointment Hold",
    "description": "Temporary slot reservation during ERP registration"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "holdToken": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "expiresAt": {
      "type": "datetime",
      "required": true
    },
    "appointmentHoldStatus": {
      "type": "enumeration",
      "enum": [
        "ACTIVE",
        "CONSUMED",
        "EXPIRED",
        "CANCELLED"
      ],
      "default": "ACTIVE"
    },
    "participantIdentityHash": {
      "type": "string"
    },
    "payload": {
      "type": "json"
    },
    "event": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::event-portal.event",
      "inversedBy": "holds"
    },
    "eventSlot": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::event-portal.event-slot",
      "inversedBy": "holds"
    }
  }
};

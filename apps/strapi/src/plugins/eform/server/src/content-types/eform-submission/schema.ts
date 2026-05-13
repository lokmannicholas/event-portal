export default {
  "kind": "collectionType",
  "collectionName": "eform_submissions",
  "info": {
    "singularName": "eform-submission",
    "pluralName": "eform-submissions",
    "displayName": "E-Form Submission",
    "description": "Submitted ERP e-form payload"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "submissionReference": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "participantName": {
      "type": "string"
    },
    "staffNumber": {
      "type": "string"
    },
    "medicalCardNumber": {
      "type": "string"
    },
    "hkidPrefix": {
      "type": "string"
    },
    "registeredEmail": {
      "type": "email"
    },
    "mobileNumber": {
      "type": "string"
    },
    "termsAccepted": {
      "type": "boolean",
      "default": false
    },
    "participantIdentityHash": {
      "type": "string"
    },
    "submittedAt": {
      "type": "datetime"
    },
    "portalSource": {
      "type": "enumeration",
      "enum": [
        "ERP",
        "EAP",
        "ECP"
      ],
      "default": "ERP"
    },
    "payload": {
      "type": "json"
    },
    "eform": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::eform.eform",
      "inversedBy": "submissions"
    }
  }
};

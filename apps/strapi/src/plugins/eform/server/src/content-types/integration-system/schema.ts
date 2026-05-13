export default {
  "kind": "collectionType",
  "collectionName": "integration_systems",
  "info": {
    "singularName": "integration-system",
    "pluralName": "integration-systems",
    "displayName": "Integration System",
    "description": "Third-party system configuration used by e-form submissions"
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
    "enabled": {
      "type": "boolean",
      "default": true
    },
    "apiMethod": {
      "type": "enumeration",
      "enum": [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE"
      ],
      "default": "POST",
      "required": true
    },
    "apiPath": {
      "type": "string",
      "required": true
    },
    "requestBodyType": {
      "type": "enumeration",
      "enum": [
        "JSON",
        "FORM_DATA"
      ],
      "default": "JSON",
      "required": true
    },
    "successResponseBody": {
      "type": "json"
    },
    "failedResponseBody": {
      "type": "json"
    },
    "eforms": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "plugin::eform.eform",
      "mappedBy": "integrationSystem"
    }
  }
};

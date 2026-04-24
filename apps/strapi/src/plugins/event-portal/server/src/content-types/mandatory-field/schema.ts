export default {
  "kind": "collectionType",
  "collectionName": "custom_fields",
  "info": {
    "singularName": "mandatory-field",
    "pluralName": "mandatory-fields",
    "displayName": "Mandatory Field",
    "description": "Mandatory registration fields managed in Strapi"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "key": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "labelEn": {
      "type": "string",
      "required": true
    },
    "labelZh": {
      "type": "string"
    },
    "fieldType": {
      "type": "enumeration",
      "enum": [
        "TEXT",
        "TEXTAREA",
        "EMAIL",
        "MOBILE",
        "NUMBER",
        "DATE",
        "SELECT",
        "CHECKBOX",
        "RADIO"
      ],
      "required": true
    },
    "required": {
      "type": "boolean",
      "default": false
    },
    "placeholderEn": {
      "type": "string"
    },
    "placeholderZh": {
      "type": "string"
    },
    "helpTextEn": {
      "type": "text"
    },
    "helpTextZh": {
      "type": "text"
    },
    "validationJson": {
      "type": "json"
    },
    "optionsJson": {
      "type": "json"
    },
    "isActive": {
      "type": "boolean",
      "default": true
    },
    "sortOrder": {
      "type": "integer",
      "default": 0
    }
  }
};

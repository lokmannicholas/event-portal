export default {
  "collectionName": "components_form_field_configs",
  "info": {
    "displayName": "field-config",
    "description": "Field configuration snapshot for templates and events"
  },
  "options": {},
  "attributes": {
    "fieldKey": {
      "type": "string",
      "required": true
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
    "visibleInErp": {
      "type": "boolean",
      "default": true
    },
    "visibleInEcp": {
      "type": "boolean",
      "default": true
    },
    "visibleInEap": {
      "type": "boolean",
      "default": true
    },
    "sortOrder": {
      "type": "integer",
      "default": 0
    },
    "isSystem": {
      "type": "boolean",
      "default": false
    },
    "placeholderEn": {
      "type": "string"
    },
    "placeholderZh": {
      "type": "string"
    },
    "optionsJson": {
      "type": "json"
    },
    "validationJson": {
      "type": "json"
    }
  }
};

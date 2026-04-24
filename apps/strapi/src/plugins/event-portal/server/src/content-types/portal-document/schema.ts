export default {
  "kind": "collectionType",
  "collectionName": "portal_documents",
  "info": {
    "singularName": "portal-document",
    "pluralName": "portal-documents",
    "displayName": "Portal Document",
    "description": "Portal-published document"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "titleEn": {
      "type": "string",
      "required": true
    },
    "titleZh": {
      "type": "string"
    },
    "descriptionEn": {
      "type": "text"
    },
    "descriptionZh": {
      "type": "text"
    },
    "portalTargets": {
      "type": "json",
      "required": true
    },
    "sortOrder": {
      "type": "integer",
      "default": 0
    },
    "active": {
      "type": "boolean",
      "default": true
    },
    "file": {
      "type": "media",
      "multiple": false,
      "required": true,
      "allowedTypes": [
        "files"
      ]
    },
    "userPartition": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::event-portal.user-partition",
      "inversedBy": "portalDocuments"
    }
  }
};

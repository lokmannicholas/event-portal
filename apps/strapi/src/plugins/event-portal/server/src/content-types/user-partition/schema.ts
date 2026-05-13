export default {
  "kind": "collectionType",
  "collectionName": "user_partitions",
  "info": {
    "singularName": "user-partition",
    "pluralName": "user-partitions",
    "displayName": "User Partition",
    "description": "Public event partition shared by ERP URL and QR scope"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "code": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "description": {
      "type": "string",
      "required": true
    },
    "slug": {
      "type": "uid",
      "targetField": "code",
      "required": true
    },
    "userPartitionStatus": {
      "type": "enumeration",
      "enum": [
        "ACTIVE",
        "DISABLED"
      ],
      "default": "ACTIVE"
    },
    "remarks": {
      "type": "text"
    },
    "logo": {
      "type": "media",
      "multiple": false,
      "allowedTypes": [
        "images"
      ]
    },
    "banners": {
      "type": "media",
      "multiple": true,
      "allowedTypes": [
        "images"
      ]
    },
    "events": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "plugin::event-portal.event",
      "mappedBy": "userPartition"
    },
    "eforms": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "plugin::eform.eform",
      "mappedBy": "userPartition"
    },
    "userGroup": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::event-portal.user-group",
      "inversedBy": "partitions"
    },
    "portalDocuments": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "plugin::event-portal.portal-document",
      "mappedBy": "userPartition"
    },
    "contactInfos": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "plugin::event-portal.contact-info",
      "mappedBy": "userPartition"
    }
  }
};

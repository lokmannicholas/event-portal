import type { Schema, Struct } from '@strapi/strapi';

export interface EventPortalFieldConfig extends Struct.ComponentSchema {
  collectionName: 'components_form_field_configs';
  info: {
    description: 'Field configuration snapshot for templates and events';
    displayName: 'field-config';
  };
  attributes: {
    fieldKey: Schema.Attribute.String & Schema.Attribute.Required;
    fieldType: Schema.Attribute.Enumeration<
      [
        'TEXT',
        'TEXTAREA',
        'EMAIL',
        'MOBILE',
        'NUMBER',
        'DATE',
        'SELECT',
        'CHECKBOX',
        'RADIO',
      ]
    > &
      Schema.Attribute.Required;
    isSystem: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    labelEn: Schema.Attribute.String & Schema.Attribute.Required;
    labelZh: Schema.Attribute.String;
    optionsJson: Schema.Attribute.JSON;
    placeholderEn: Schema.Attribute.String;
    placeholderZh: Schema.Attribute.String;
    required: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    sortOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    validationJson: Schema.Attribute.JSON;
    visibleInEap: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    visibleInEcp: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    visibleInErp: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
  };
}

export interface EventPortalTemplateMessage extends Struct.ComponentSchema {
  collectionName: 'components_notification_template_messages';
  info: {
    description: 'Per-event notice template mapping by notice type';
    displayName: 'template-message';
  };
  attributes: {
    enabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    noticeTemplate: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::event-portal.notice-template'
    >;
    templateType: Schema.Attribute.Enumeration<
      ['REGISTRATION', 'ANNOUNCEMENT', 'EVENT_UPDATE']
    > &
      Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'event-portal.field-config': EventPortalFieldConfig;
      'event-portal.template-message': EventPortalTemplateMessage;
    }
  }
}

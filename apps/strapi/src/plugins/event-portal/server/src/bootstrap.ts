import type { Core } from '@strapi/strapi';
import { validateEventNoticeTemplateAssignments } from './utils/event-notice-templates';

async function seedDefaultMandatoryFields(strapi: Core.Strapi) {
  const existing = await strapi.documents('plugin::event-portal.mandatory-field').findMany({
    limit: 1,
  });

  if (Array.isArray(existing) && existing.length > 0) {
    return;
  }

  const defaults = [
    {
      key: 'participant_name',
      labelEn: 'Full Name in English (Legal name)',
      labelZh: '英文全名（與法律文件相同）',
      fieldType: 'TEXT',
      required: true,
      isActive: true,
      sortOrder: 10,
    },
    {
      key: 'staff_number',
      labelEn: 'Staff Number',
      labelZh: '員工編號',
      fieldType: 'TEXT',
      required: true,
      isActive: true,
      sortOrder: 20,
    },
    {
      key: 'medical_card_number',
      labelEn: 'Medical Card Number',
      labelZh: '醫療卡號碼',
      fieldType: 'TEXT',
      required: false,
      isActive: true,
      sortOrder: 30,
    },
    {
      key: 'hkid_prefix',
      labelEn: 'First 4 digits of HKID or Passport',
      labelZh: '香港身份證／護照首四位字元',
      fieldType: 'TEXT',
      required: false,
      isActive: true,
      sortOrder: 40,
    },
    {
      key: 'registered_email',
      labelEn: 'Registered eMail',
      labelZh: '登記電郵',
      fieldType: 'EMAIL',
      required: true,
      isActive: true,
      sortOrder: 50,
    },
    {
      key: 'mobile_number',
      labelEn: 'Mobile No.',
      labelZh: '手提電話號碼',
      fieldType: 'MOBILE',
      required: true,
      isActive: true,
      sortOrder: 60,
    },
  ];

  for (const field of defaults) {
    await strapi.documents('plugin::event-portal.mandatory-field').create({
      data: field as any,
    });
  }
}

export async function bootstrap({ strapi }: { strapi: Core.Strapi }) {
  await seedDefaultMandatoryFields(strapi);

  strapi.db.lifecycles.subscribe({
    models: ['plugin::event-portal.event'],
    async beforeCreate(event) {
      await validateEventNoticeTemplateAssignments(strapi, event.params.data as Record<string, unknown> | undefined);
    },
    async beforeUpdate(event) {
      await validateEventNoticeTemplateAssignments(strapi, event.params.data as Record<string, unknown> | undefined);
    },
  });
}

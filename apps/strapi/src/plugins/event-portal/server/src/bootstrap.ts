import type { Core } from '@strapi/strapi';
import { randomUUID } from 'node:crypto';
import { validateEventNoticeTemplateAssignments } from './utils/event-notice-templates';

function ensurePublicUuid(data: Record<string, unknown> | undefined) {
  if (!data || typeof data.publicUuid === 'string') {
    return;
  }

  data.publicUuid = randomUUID();
}

function ensureAccessType(data: Record<string, unknown> | undefined) {
  if (!data || typeof data.eventAccessType === 'string') {
    return;
  }

  data.eventAccessType = 'PUBLIC';
}

async function ensureExistingPublicUuid(
  strapi: Core.Strapi,
  uid: any,
  data: Record<string, unknown> | undefined,
  where: { documentId?: string } | undefined,
) {
  if (!data || 'publicUuid' in data || !where?.documentId) {
    return;
  }

  const existingRecord = await strapi.documents(uid).findOne({
    documentId: where.documentId,
  });

  if (!existingRecord?.publicUuid) {
    data.publicUuid = randomUUID();
  }
}

async function ensureExistingAccessType(
  strapi: Core.Strapi,
  uid: any,
  data: Record<string, unknown> | undefined,
  where: { documentId?: string } | undefined,
) {
  if (!data || 'eventAccessType' in data || !where?.documentId) {
    return;
  }

  const existingRecord = await strapi.documents(uid).findOne({
    documentId: where.documentId,
  });

  if (!existingRecord?.eventAccessType) {
    data.eventAccessType = 'PUBLIC';
  }
}

async function backfillPublicUuids(strapi: Core.Strapi, uid: any) {
  const pageSize = 100;

  for (let start = 0; ; start += pageSize) {
    const records = (await strapi.documents(uid).findMany({
      start,
      limit: pageSize,
    })) as Array<{ documentId?: string; publicUuid?: string | null }>;

    if (records.length === 0) {
      break;
    }

    for (const record of records) {
      if (!record?.documentId || record.publicUuid) {
        continue;
      }

      await strapi.documents(uid).update({
        documentId: record.documentId,
        data: {
          publicUuid: randomUUID(),
        } as any,
      });
    }
  }
}

async function backfillAccessTypes(strapi: Core.Strapi, uid: any) {
  const pageSize = 100;

  for (let start = 0; ; start += pageSize) {
    const records = (await strapi.documents(uid).findMany({
      start,
      limit: pageSize,
    })) as Array<{ documentId?: string; eventAccessType?: string | null }>;

    if (records.length === 0) {
      break;
    }

    for (const record of records) {
      if (!record?.documentId || record.eventAccessType) {
        continue;
      }

      await strapi.documents(uid).update({
        documentId: record.documentId,
        data: {
          eventAccessType: 'PUBLIC',
        } as any,
      });
    }
  }
}

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
  await backfillPublicUuids(strapi, 'plugin::event-portal.event');
  await backfillAccessTypes(strapi, 'plugin::event-portal.event');

  strapi.db.lifecycles.subscribe({
    models: ['plugin::event-portal.event'],
    async beforeCreate(event) {
      const data = event.params.data as Record<string, unknown> | undefined;
      ensurePublicUuid(data);
      ensureAccessType(data);
      await validateEventNoticeTemplateAssignments(strapi, data);
    },
    async beforeUpdate(event) {
      const data = event.params.data as Record<string, unknown> | undefined;
      await ensureExistingPublicUuid(strapi, 'plugin::event-portal.event', data, event.params.where as { documentId?: string } | undefined);
      await ensureExistingAccessType(strapi, 'plugin::event-portal.event', data, event.params.where as { documentId?: string } | undefined);
      await validateEventNoticeTemplateAssignments(strapi, data);
    },
  });
}

import type { Core } from '@strapi/strapi';
import { randomUUID } from 'node:crypto';

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

  const existingRecord = await (strapi.documents as any)(uid).findOne({
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

  const existingRecord = await (strapi.documents as any)(uid).findOne({
    documentId: where.documentId,
  });

  if (!existingRecord?.eventAccessType) {
    data.eventAccessType = 'PUBLIC';
  }
}

async function backfillPublicUuids(strapi: Core.Strapi, uid: any) {
  const pageSize = 100;

  for (let start = 0; ; start += pageSize) {
    const records = (await (strapi.documents as any)(uid).findMany({
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

      await (strapi.documents as any)(uid).update({
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
    const records = (await (strapi.documents as any)(uid).findMany({
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

      await (strapi.documents as any)(uid).update({
        documentId: record.documentId,
        data: {
          eventAccessType: 'PUBLIC',
        } as any,
      });
    }
  }
}

export async function bootstrap({ strapi }: { strapi: Core.Strapi }) {
  await backfillPublicUuids(strapi, 'plugin::eform.eform');
  await backfillAccessTypes(strapi, 'plugin::eform.eform');

  strapi.db.lifecycles.subscribe({
    models: ['plugin::eform.eform'],
    async beforeCreate(event) {
      const data = event.params.data as Record<string, unknown> | undefined;
      ensurePublicUuid(data);
      ensureAccessType(data);
    },
    async beforeUpdate(event) {
      const data = event.params.data as Record<string, unknown> | undefined;
      await ensureExistingPublicUuid(strapi, 'plugin::eform.eform', data, event.params.where as { documentId?: string } | undefined);
      await ensureExistingAccessType(strapi, 'plugin::eform.eform', data, event.params.where as { documentId?: string } | undefined);
    },
  });
}

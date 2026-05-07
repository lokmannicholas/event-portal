import type { Core } from '@strapi/strapi';

type AnyRecord = Record<string, any>;

export type EventNoticeType = 'REGISTRATION' | 'ANNOUNCEMENT' | 'EVENT_UPDATE';
export type EventNoticeChannel = 'EMAIL' | 'SMS';
export type EventNoticeTemplateFieldKey =
  | 'emailRegistrationNoticeTemplate'
  | 'emailAnnouncementNoticeTemplate'
  | 'emailEventUpdateNoticeTemplate'
  | 'smsRegistrationNoticeTemplate'
  | 'smsAnnouncementNoticeTemplate'
  | 'smsEventUpdateNoticeTemplate';

type EventNoticeTemplateConfig = {
  key: EventNoticeTemplateFieldKey;
  noticeType: EventNoticeType;
  channel: EventNoticeChannel;
  label: string;
};

export const eventNoticeTemplateConfigs: EventNoticeTemplateConfig[] = [
  {
    key: 'smsRegistrationNoticeTemplate',
    noticeType: 'REGISTRATION',
    channel: 'SMS',
    label: 'SMS Registration notice template',
  },
  {
    key: 'smsAnnouncementNoticeTemplate',
    noticeType: 'ANNOUNCEMENT',
    channel: 'SMS',
    label: 'SMS Announcement notice template',
  },
  {
    key: 'smsEventUpdateNoticeTemplate',
    noticeType: 'EVENT_UPDATE',
    channel: 'SMS',
    label: 'SMS Event update notice template',
  },
  {
    key: 'emailRegistrationNoticeTemplate',
    noticeType: 'REGISTRATION',
    channel: 'EMAIL',
    label: 'EMAIL Registration notice template',
  },
  {
    key: 'emailAnnouncementNoticeTemplate',
    noticeType: 'ANNOUNCEMENT',
    channel: 'EMAIL',
    label: 'EMAIL Announcement notice template',
  },
  {
    key: 'emailEventUpdateNoticeTemplate',
    noticeType: 'EVENT_UPDATE',
    channel: 'EMAIL',
    label: 'EMAIL Event update notice template',
  },
];

function extractScalarRelationValues(value: unknown): Array<string | number> {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractScalarRelationValues(entry));
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return [value];
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  if ('documentId' in value && typeof (value as { documentId?: unknown }).documentId === 'string') {
    return [(value as { documentId: string }).documentId];
  }

  if ('id' in value && typeof (value as { id?: unknown }).id === 'number') {
    return [(value as { id: number }).id];
  }

  const relationOperation = value as {
    connect?: unknown;
    set?: unknown;
    disconnect?: unknown;
  };

  if (relationOperation.connect !== undefined) {
    return extractScalarRelationValues(relationOperation.connect);
  }

  if (relationOperation.set !== undefined) {
    return extractScalarRelationValues(relationOperation.set);
  }

  if (Array.isArray(relationOperation.disconnect)) {
    return [];
  }

  return [];
}

async function loadNoticeTemplateByReference(strapi: Core.Strapi, reference: string | number) {
  if (typeof reference === 'string') {
    return (await strapi.documents('plugin::event-portal.notice-template').findOne({
      documentId: reference,
    })) as AnyRecord | null;
  }

  const matches = (await strapi.documents('plugin::event-portal.notice-template').findMany({
    filters: {
      id: {
        $eq: reference,
      },
    },
    limit: 1,
  })) as AnyRecord[];

  return matches[0] ?? null;
}

export function getEventNoticeTemplateFieldKey(noticeType: EventNoticeType, channel: EventNoticeChannel): EventNoticeTemplateFieldKey {
  const config = eventNoticeTemplateConfigs.find((entry) => entry.noticeType === noticeType && entry.channel === channel);

  if (!config) {
    throw new Error(`Unsupported notice template mapping for ${channel} ${noticeType}.`);
  }

  return config.key;
}

export function resolveEventNoticeTemplate(
  event: AnyRecord | null | undefined,
  noticeType: EventNoticeType,
  channel: EventNoticeChannel,
) {
  if (!event) {
    return undefined;
  }

  return event[getEventNoticeTemplateFieldKey(noticeType, channel)];
}

export async function validateEventNoticeTemplateAssignments(strapi: Core.Strapi, data: Record<string, unknown> | undefined) {
  if (!data) {
    return;
  }

  for (const config of eventNoticeTemplateConfigs) {
    const values = extractScalarRelationValues(data[config.key]);

    if (values.length === 0) {
      continue;
    }

    const template = await loadNoticeTemplateByReference(strapi, values[0]);

    if (!template) {
      throw new Error(`${config.label} must reference an existing notice template.`);
    }

    if (template.channel !== config.channel) {
      throw new Error(`${config.label} only accepts ${config.channel} notice templates.`);
    }
  }
}

import { randomUUID } from 'node:crypto';
import type { Core } from '@strapi/strapi';
import { buildAppointmentIdentityHash, createBookingReference, createCancelToken, createHoldToken } from '../utils/booking';
import { deriveEventStatus } from '../utils/event-status';
import { mapAppointment, mapContact, mapDocument, mapEventDetail, mapEventListItem, mapGroup, mapPartition, mapTemplate, mapUser } from '../utils/mappers';
import { sendNotification } from '../utils/notifier';
import { calculateRemaining } from '../utils/slot-capacity';

type AnyRecord = Record<string, any>;
type PortalTarget = 'EAP' | 'ECP' | 'ERP';
type EcpScope = {
  groupCode: string;
  partitionCodes: string[];
};

type ManagementEventSlotInput = {
  documentId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  enabled?: boolean;
  quota?: number;
  usedCount?: number;
  holdCount?: number;
  sortOrder?: number;
};

type SendNoticesInput = {
  noticeTemplateDocumentId?: string;
  eventDocumentId?: string;
  noticeType?: 'REGISTRATION' | 'ANNOUNCEMENT' | 'EVENT_UPDATE';
  appointmentDocumentIds?: string[];
  batchSize?: number;
  actorEmail?: string;
};

function toArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function nowIso() {
  return new Date().toISOString();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function publicBaseUrl() {
  return process.env.PUBLIC_FRONTEND_URL ?? 'http://localhost:3002';
}

function matchesPartitionScope(partitionCode: string | undefined, partitionCodes: string[]) {
  return partitionCodes.includes(String(partitionCode ?? ''));
}

function getEventStatus(event: AnyRecord) {
  return event.eventStatus ?? event.status;
}

function getAppointmentStatus(appointment: AnyRecord) {
  return appointment.appointmentStatus ?? appointment.status;
}

function getAppointmentHoldStatus(hold: AnyRecord) {
  return hold.appointmentHoldStatus ?? hold.status;
}

function getUserGroupStatus(group: AnyRecord) {
  return group.userGroupStatus ?? group.status;
}

function normalizeTimeValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  if (/^\d{2}:\d{2}:\d{2}\.\d{3}$/.test(trimmed)) {
    return trimmed.slice(0, 8);
  }

  return trimmed;
}

function normalizeManagementEventSlots(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((value): value is ManagementEventSlotInput => Boolean(value) && typeof value === 'object')
    .map((slot) => ({
      documentId: typeof slot.documentId === 'string' && slot.documentId.trim() ? slot.documentId.trim() : undefined,
      eventDate: typeof slot.date === 'string' ? slot.date.trim() : '',
      startTime: typeof slot.startTime === 'string' ? normalizeTimeValue(slot.startTime) : '',
      endTime: typeof slot.endTime === 'string' ? normalizeTimeValue(slot.endTime) : '',
      enabled: slot.enabled !== false,
      quota: Number(slot.quota ?? 0),
      usedCount: Number(slot.usedCount ?? 0),
      holdCount: Number(slot.holdCount ?? 0),
      sortOrder: Number(slot.sortOrder ?? 0),
    }))
    .filter(
      (slot) =>
        slot.eventDate &&
        slot.startTime &&
        slot.endTime &&
        Number.isFinite(slot.quota) &&
        slot.quota >= 0 &&
        Number.isFinite(slot.usedCount) &&
        slot.usedCount >= 0 &&
        Number.isFinite(slot.holdCount) &&
        slot.holdCount >= 0,
    );
}

function chunkArray<T>(values: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

function buildNoticeTemplateVariables(appointment: AnyRecord) {
  const event = appointment.event ?? {};

  return {
    bookingReference: String(appointment.bookingReference ?? ''),
    participantName: String(appointment.participantName ?? ''),
    staffNumber: String(appointment.staffNumber ?? ''),
    registeredEmail: String(appointment.registeredEmail ?? ''),
    mobileNumber: String(appointment.mobileNumber ?? ''),
    eventName: String(event.eventName ?? ''),
    companyName: String(event.companyName ?? ''),
    location: String(event.location ?? ''),
    appointmentDate: String(appointment.appointmentDate ?? ''),
    appointmentStartTime: String(appointment.appointmentStartTime ?? ''),
    appointmentEndTime: String(appointment.appointmentEndTime ?? ''),
    cancelLink: appointment.cancelToken
      ? `${publicBaseUrl()}/enquiry?cancelToken=${appointment.cancelToken}&appointment=${appointment.documentId}`
      : '',
  };
}

function renderNoticeContent(template: AnyRecord, appointment: AnyRecord) {
  const variables = buildNoticeTemplateVariables(appointment);
  const replaceTokens = (value: string | undefined) =>
    (value ?? '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, token) => variables[token as keyof typeof variables] ?? '');

  return {
    subject: replaceTokens(template.subject),
    plainTextBody: replaceTokens(template.plainTextBody),
    htmlBody: replaceTokens(template.htmlBody),
  };
}

function resolveNoticeRecipient(appointment: AnyRecord, channel: 'EMAIL' | 'SMS') {
  return channel === 'EMAIL' ? String(appointment.registeredEmail ?? '').trim() : String(appointment.mobileNumber ?? '').trim();
}

async function createAndSendNotice(
  strapi: Core.Strapi,
  template: AnyRecord,
  appointment: AnyRecord,
) {
  const channel = template.channel as 'EMAIL' | 'SMS';
  const recipient = resolveNoticeRecipient(appointment, channel);
  const rendered = renderNoticeContent(template, appointment);

  const notice = await strapi.documents('plugin::event-portal.notice').create({
    data: {
      channel,
      recipient: recipient || 'MISSING_RECIPIENT',
      subject: channel === 'EMAIL' ? rendered.subject || undefined : undefined,
      plainTextBody: rendered.plainTextBody,
      htmlBody: channel === 'EMAIL' ? rendered.htmlBody || undefined : undefined,
      noticeStatus: 'PENDING',
      noticeTemplate: template.documentId,
      appointment: appointment.documentId,
      event: appointment.event?.documentId,
    } as any,
  });

  if (!recipient) {
    await strapi.documents('plugin::event-portal.notice').update({
      documentId: notice.documentId,
      data: {
        noticeStatus: 'FAILED',
        errorMessage: channel === 'EMAIL' ? 'Registered email is missing.' : 'Mobile number is missing.',
      } as any,
    });

    return { status: 'FAILED' as const, documentId: notice.documentId };
  }

  try {
    await sendNotification(strapi, {
      channel,
      to: recipient,
      subject: channel === 'EMAIL' ? rendered.subject || undefined : undefined,
      body: rendered.plainTextBody,
      htmlBody: channel === 'EMAIL' ? rendered.htmlBody || undefined : undefined,
    });

    await strapi.documents('plugin::event-portal.notice').update({
      documentId: notice.documentId,
      data: {
        noticeStatus: 'SENT',
        errorMessage: null,
        sentAt: nowIso(),
      } as any,
    });

    return { status: 'SENT' as const, documentId: notice.documentId };
  } catch (error) {
    await strapi.documents('plugin::event-portal.notice').update({
      documentId: notice.documentId,
      data: {
        noticeStatus: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown delivery error',
      } as any,
    });

    return { status: 'FAILED' as const, documentId: notice.documentId };
  }
}

function resolveEventNoticeTemplate(event: AnyRecord | null, noticeType: string | undefined) {
  if (!event || !noticeType) {
    return undefined;
  }

  return toArray<any>(event.notificationTemplates).find(
    (notification) => notification.templateType === noticeType && notification.noticeTemplate,
  )?.noticeTemplate;
}

function eventVisibleInEcp(event: AnyRecord, scope: EcpScope | null) {
  if (!scope) {
    return false;
  }

  return matchesPartitionScope(event.userPartition?.code, scope.partitionCodes) && getEventStatus(event) !== 'CLOSED';
}

function eventVisibleInErp(event: AnyRecord) {
  return event.publishedToPortals === true && getEventStatus(event) === 'RELEASED';
}

function toItemResponse<T>(data: T) {
  return {
    data,
    meta: {},
  };
}

function toCollectionResponse<T>(data: T[]) {
  return {
    data,
    meta: {
      pagination: {
        page: 1,
        pageSize: data.length,
        pageCount: data.length > 0 ? 1 : 0,
        total: data.length,
      },
    },
  };
}

function sanitizeUser(record: AnyRecord) {
  const portalRole = record.portalRole ?? 'CLIENT_HR';
  const userGroups =
    portalRole === 'CLIENT_HR'
      ? toArray<any>(record.userGroups).map((group: AnyRecord) => ({
          id: group.id,
          documentId: group.documentId,
          code: group.code,
          description: group.description,
          status: getUserGroupStatus(group),
        }))
      : [];

  return {
    id: record.id,
    documentId: record.documentId,
    username: record.username,
    email: record.email,
    confirmed: record.confirmed,
    blocked: record.blocked,
    provider: record.provider,
    portalRole,
    lastLoginAt: record.lastLoginAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    role: record.role
      ? {
          id: record.role.id,
          documentId: record.role.documentId,
          name: record.role.name,
          description: record.role.description,
          type: record.role.type,
        }
      : null,
    userGroups,
  };
}

function buildUserWriteData(input: AnyRecord, mode: 'create' | 'update') {
  const portalRole = input.portalRole ?? 'CLIENT_HR';

  return {
    username: input.username ?? input.email,
    email: input.email,
    provider: 'local',
    password: mode === 'create' ? input.password ?? randomUUID() : input.password,
    confirmed: mode === 'create' ? input.confirmed ?? true : input.confirmed,
    blocked:
      typeof input.blocked === 'boolean'
        ? input.blocked
        : input.status === 'DISABLED'
          ? true
          : input.status === 'ACTIVE'
            ? false
            : undefined,
    portalRole,
    lastLoginAt: input.lastLoginAt,
    role: input.role,
    userGroups: portalRole === 'ADMIN' ? [] : (input.userGroups ?? []),
  };
}

async function getDefaultUsersPermissionsRole(strapi: Core.Strapi) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: {
      type: 'authenticated',
    },
  });

  return role?.id;
}

async function createAuditLog(
  strapi: Core.Strapi,
  input: {
    entityType: string;
    entityDocumentId?: string;
    action: string;
    actorEmail?: string;
    actorRole?: string;
    appointmentDocumentId?: string;
    eventDocumentId?: string;
    details?: Record<string, unknown>;
  },
) {
  await strapi.documents('plugin::event-portal.audit-log').create({
    data: {
      entityType: input.entityType,
      entityDocumentId: input.entityDocumentId,
      action: input.action,
      actorEmail: input.actorEmail,
      actorRole: input.actorRole,
      details: input.details ?? {},
      appointment: input.appointmentDocumentId ? input.appointmentDocumentId : undefined,
      event: input.eventDocumentId ? input.eventDocumentId : undefined,
    },
  });
}

async function fetchEventList(strapi: Core.Strapi) {
  return (await strapi.documents('plugin::event-portal.event').findMany({
    populate: {
      userPartition: true,
    },
    sort: ['eventStartDate:asc', 'eventName:asc'],
    limit: 200,
  })) as AnyRecord[];
}

async function fetchEventDetailRecord(strapi: Core.Strapi, documentId: string) {
  return (await strapi.documents('plugin::event-portal.event').findOne({
    documentId,
    populate: {
      userPartition: true,
      slots: true,
      template: {
        populate: {
          formFields: true,
        },
      },
      notificationTemplates: {
        populate: {
          noticeTemplate: true,
        },
      },
    },
  })) as AnyRecord | null;
}

async function fetchEventDetailRecordByIdentifier(strapi: Core.Strapi, identifier: string) {
  const byDocumentId = await fetchEventDetailRecord(strapi, identifier);

  if (byDocumentId) {
    return byDocumentId;
  }

  const records = (await strapi.documents('plugin::event-portal.event').findMany({
    filters: {
      publicSlug: identifier,
    },
    populate: {
      userPartition: true,
      slots: true,
      template: {
        populate: {
          formFields: true,
        },
      },
      notificationTemplates: {
        populate: {
          noticeTemplate: true,
        },
      },
    },
    limit: 1,
  })) as AnyRecord[];

  return records[0] ?? null;
}

async function fetchAppointmentList(strapi: Core.Strapi) {
  return (await strapi.documents('plugin::event-portal.appointment').findMany({
    populate: {
      event: {
        populate: {
          userPartition: true,
        },
      },
      eventSlot: true,
    },
    sort: ['appointmentDate:asc', 'appointmentStartTime:asc'],
    limit: 500,
  })) as AnyRecord[];
}

async function findSlotWithEventContext(strapi: Core.Strapi, documentId: string) {
  return (await strapi.documents('plugin::event-portal.event-slot').findOne({
    documentId,
    populate: {
      event: {
        populate: {
          userPartition: true,
        },
      },
    },
  })) as AnyRecord | null;
}

async function fetchEcpScope(strapi: Core.Strapi, groupCode: string): Promise<EcpScope | null> {
  if (!groupCode) {
    return null;
  }

  const groups = (await strapi.documents('plugin::event-portal.user-group').findMany({
    filters: {
      code: groupCode,
    },
    populate: {
      partitions: true,
    },
    limit: 1,
  })) as AnyRecord[];

  const group = groups[0];

  if (!group) {
    return null;
  }

  return {
    groupCode,
    partitionCodes: toArray<any>(group.partitions).map((partition: any) => String(partition.code)),
  };
}

async function fetchPortalDocuments(strapi: Core.Strapi, target: PortalTarget, partitionCodes?: string[]) {
  const records = (await strapi.documents('plugin::event-portal.portal-document').findMany({
    populate: {
      file: true,
      userPartition: true,
    },
    sort: ['sortOrder:asc', 'titleEn:asc'],
    limit: 200,
  })) as AnyRecord[];

  return records
    .filter((record) => record.active !== false)
    .filter((record) => toArray(record.portalTargets).includes(target))
    .filter((record) => partitionCodes === undefined || !record.userPartition?.code || matchesPartitionScope(record.userPartition?.code, partitionCodes))
    .map(mapDocument);
}

async function fetchPortalContacts(strapi: Core.Strapi, target: PortalTarget, partitionCodes?: string[]) {
  const records = (await strapi.documents('plugin::event-portal.contact-info').findMany({
    populate: {
      userPartition: true,
    },
    sort: ['sortOrder:asc', 'titleEn:asc'],
    limit: 200,
  })) as AnyRecord[];

  return records
    .filter((record) => record.active !== false)
    .filter((record) => toArray(record.portalTargets).includes(target))
    .filter((record) => partitionCodes === undefined || !record.userPartition?.code || matchesPartitionScope(record.userPartition?.code, partitionCodes))
    .map(mapContact);
}

async function fetchUserRecord(strapi: Core.Strapi, documentId: string) {
  return (await strapi.documents('plugin::users-permissions.user').findOne({
    documentId,
    populate: {
      role: true,
      userGroups: true,
    },
  })) as AnyRecord | null;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async eapDashboard() {
    const [partitionCount, groupCount, templateCount, confirmedAppointmentCount] = await Promise.all([
      strapi.db.query('plugin::event-portal.user-partition').count(),
      strapi.db.query('plugin::event-portal.user-group').count(),
      strapi.db.query('plugin::event-portal.event-template').count(),
      strapi.db.query('plugin::event-portal.appointment').count({
        where: {
          appointmentStatus: 'CONFIRMED',
        },
      }),
    ]);

    return {
      headline: 'EAP overview',
      stats: [
        { label: 'Partitions', value: String(partitionCount), helper: 'Event access scopes' },
        { label: 'User groups', value: String(groupCount), helper: 'Portal access groups' },
        { label: 'Templates', value: String(templateCount), helper: 'Reusable event blueprints' },
        { label: 'Appointments', value: String(confirmedAppointmentCount), helper: 'Confirmed bookings' },
      ],
    };
  },

  async eapPartitions() {
    const records = (await strapi.documents('plugin::event-portal.user-partition').findMany({
      populate: {
        userGroup: true,
        template: true,
      },
      sort: ['code:asc'],
      limit: 200,
    })) as AnyRecord[];

    return records.map(mapPartition);
  },

  async eapGroups() {
    const records = (await strapi.documents('plugin::event-portal.user-group').findMany({
      populate: {
        partitions: true,
        portalUsers: true,
      },
      sort: ['code:asc'],
      limit: 200,
    })) as AnyRecord[];

    return records.map(mapGroup);
  },

  async eapUsers() {
    const records = (await strapi.documents('plugin::users-permissions.user').findMany({
      populate: {
        role: true,
        userGroups: true,
      },
      sort: ['username:asc', 'email:asc'],
      limit: 200,
    })) as AnyRecord[];

    return records.map(mapUser);
  },

  async eapUser(documentId: string) {
    const record = await fetchUserRecord(strapi, documentId);
    return record ? mapUser(record) : null;
  },

  async managementUsers() {
    const records = (await strapi.documents('plugin::users-permissions.user').findMany({
      populate: {
        role: true,
        userGroups: true,
      },
      sort: ['username:asc', 'email:asc'],
      limit: 200,
    })) as AnyRecord[];

    return toCollectionResponse(records.map(sanitizeUser));
  },

  async managementUser(documentId: string) {
    const record = await fetchUserRecord(strapi, documentId);

    if (!record) {
      throw new Error('User not found');
    }

    return toItemResponse(sanitizeUser(record));
  },

  async createManagementUser(input: AnyRecord) {
    const defaultRoleId = await getDefaultUsersPermissionsRole(strapi);
    const created = (await strapi.documents('plugin::users-permissions.user').create({
      data: {
        ...buildUserWriteData(input, 'create'),
        role: input.role ?? defaultRoleId,
      },
      populate: {
        role: true,
        userGroups: true,
      },
    })) as AnyRecord;

    return toItemResponse(sanitizeUser(created));
  },

  async replaceManagementUser(documentId: string, input: AnyRecord) {
    const updated = (await strapi.documents('plugin::users-permissions.user').update({
      documentId,
      data: buildUserWriteData(input, 'create') as any,
      populate: {
        role: true,
        userGroups: true,
      },
    })) as AnyRecord;

    return toItemResponse(sanitizeUser(updated));
  },

  async updateManagementUser(documentId: string, input: AnyRecord) {
    const updated = (await strapi.documents('plugin::users-permissions.user').update({
      documentId,
      data: buildUserWriteData(input, 'update') as any,
      populate: {
        role: true,
        userGroups: true,
      },
    })) as AnyRecord;

    return toItemResponse(sanitizeUser(updated));
  },

  async eapTemplates() {
    const records = (await strapi.documents('plugin::event-portal.event-template').findMany({
      populate: {
        userPartitions: true,
        formFields: true,
      },
      sort: ['name:asc'],
      limit: 200,
    })) as AnyRecord[];

    return records.map(mapTemplate);
  },

  async eapEvents() {
    const events = await fetchEventList(strapi);
    return events.map(mapEventListItem);
  },

  async eapAppointments(eventDocumentId?: string) {
    const appointments = await fetchAppointmentList(strapi);
    return appointments
      .filter((appointment) => !eventDocumentId || appointment.event?.documentId === eventDocumentId)
      .map(mapAppointment);
  },

  async portalDocuments(target: PortalTarget) {
    return fetchPortalDocuments(strapi, target);
  },

  async portalContacts(target: PortalTarget) {
    return fetchPortalContacts(strapi, target);
  },

  async ecpDashboard(groupCode: string) {
    const scope = await fetchEcpScope(strapi, groupCode);
    const events = scope ? (await fetchEventList(strapi)).filter((event) => eventVisibleInEcp(event, scope)) : [];
    const appointments = scope
      ? (await fetchAppointmentList(strapi)).filter((appointment) => matchesPartitionScope(appointment.event?.userPartition?.code, scope.partitionCodes))
      : [];
    const documents = scope ? await fetchPortalDocuments(strapi, 'ECP', scope.partitionCodes) : [];

    return {
      headline: 'ECP overview',
      stats: [
        { label: 'Visible events', value: String(events.length), helper: scope?.groupCode || 'Client group' },
        { label: 'Confirmed bookings', value: String(appointments.filter((item) => getAppointmentStatus(item) === 'CONFIRMED').length), helper: 'Across visible events' },
        { label: 'Documents', value: String(documents.length), helper: 'Portal downloads' },
      ],
    };
  },

  async ecpEvents(groupCode: string) {
    const scope = await fetchEcpScope(strapi, groupCode);

    if (!scope) {
      return [];
    }

    const events = await fetchEventList(strapi);
    return events.filter((event) => eventVisibleInEcp(event, scope)).map(mapEventListItem);
  },

  async ecpEventDetail(identifier: string, groupCode: string) {
    const scope = await fetchEcpScope(strapi, groupCode);
    const event = await fetchEventDetailRecordByIdentifier(strapi, identifier);

    if (!event || !eventVisibleInEcp(event, scope)) {
      return null;
    }

    return mapEventDetail(event);
  },

  async ecpDocuments(groupCode: string) {
    const scope = await fetchEcpScope(strapi, groupCode);
    return scope ? fetchPortalDocuments(strapi, 'ECP', scope.partitionCodes) : [];
  },

  async ecpContacts(groupCode: string) {
    const scope = await fetchEcpScope(strapi, groupCode);
    return scope ? fetchPortalContacts(strapi, 'ECP', scope.partitionCodes) : [];
  },

  async erpPartitionLanding(partitionCode: string) {
    const partition = (await strapi.documents('plugin::event-portal.user-partition').findMany({
      filters: {
        code: partitionCode,
      },
      populate: {
        logo: true,
        banners: true,
        userGroups: true,
      },
      limit: 1,
    })) as AnyRecord[];

    const selectedPartition = partition[0];

    if (!selectedPartition) {
      return null;
    }

    const events = (await fetchEventList(strapi))
      .filter((event) => event.userPartition?.code === partitionCode)
      .filter(eventVisibleInErp)
      .map(mapEventListItem);

    return {
      partition: mapPartition(selectedPartition),
      events,
      documents: await fetchPortalDocuments(strapi, 'ERP'),
      contacts: await fetchPortalContacts(strapi, 'ERP'),
    };
  },

  async erpEventDetail(identifier: string, partitionCode?: string) {
    const event = await fetchEventDetailRecordByIdentifier(strapi, identifier);

    if (!event || (partitionCode && event.userPartition?.code !== partitionCode) || !eventVisibleInErp(event)) {
      return null;
    }

    return mapEventDetail(event);
  },

  async createHold(input: { eventDocumentId: string; eventSlotDocumentId: string }) {
    const slot = await findSlotWithEventContext(strapi, input.eventSlotDocumentId);

    if (!slot?.event) {
      throw new Error('Timeslot not found');
    }

    const event = slot.event as AnyRecord;

    if (event.documentId !== input.eventDocumentId) {
      throw new Error('Timeslot does not belong to the requested event');
    }

    if (getEventStatus(event) === 'DISABLED' || getEventStatus(event) === 'CLOSED') {
      throw new Error('This event is not available for booking');
    }

    if (slot.enabled === false) {
      throw new Error('This timeslot is disabled');
    }

    const remaining = calculateRemaining(slot);

    if (remaining <= 0) {
      throw new Error('This timeslot is full');
    }

    const holdMinutes = Number(process.env.ERP_HOLD_MINUTES ?? 5);
    const expiresAt = new Date(Date.now() + holdMinutes * 60_000).toISOString();
    const holdToken = createHoldToken();

    await strapi.documents('plugin::event-portal.appointment-hold').create({
      data: {
        holdToken: holdToken,
        expiresAt: expiresAt,
        appointmentHoldStatus: 'ACTIVE',
        event: event.documentId,
        eventSlot: slot.documentId,
      },
    });

    await strapi.documents('plugin::event-portal.event-slot').update({
      documentId: slot.documentId,
      data: {
        holdCount: (slot.holdCount ?? 0) + 1,
      } as any,
    });

    return {
      holdToken,
      expiresAt,
      remaining: remaining - 1,
      slotDocumentId: slot.documentId,
    };
  },

  async createBooking(input: {
    eventDocumentId: string;
    eventSlotDocumentId: string;
    holdToken: string;
    participantName: string;
    staffNumber?: string;
    medicalCardNumber?: string;
    hkidPrefix?: string;
    registeredEmail?: string;
    mobileNumber?: string;
    communicationPreference: 'EMAIL' | 'SMS';
    termsAccepted: boolean;
    formValues?: Record<string, string>;
  }) {
    if (!input.termsAccepted) {
      throw new Error('Terms and conditions must be accepted');
    }

    const event = await fetchEventDetailRecord(strapi, input.eventDocumentId);

    if (!event) {
      throw new Error('Event not found');
    }

    const holdRecords = (await strapi.documents('plugin::event-portal.appointment-hold').findMany({
      filters: {
        holdToken: input.holdToken,
        appointmentHoldStatus: 'ACTIVE',
      },
      populate: {
        event: true,
        eventSlot: true,
      },
      limit: 1,
    })) as AnyRecord[];

    const hold = holdRecords[0];

    if (!hold) {
      throw new Error('Hold not found or expired');
    }

    if (hold.event?.documentId !== input.eventDocumentId || hold.eventSlot?.documentId !== input.eventSlotDocumentId) {
      throw new Error('Hold does not match the selected event timeslot');
    }

    if (new Date(hold.expiresAt).getTime() < Date.now()) {
      throw new Error('Hold has expired');
    }

    const slot = await findSlotWithEventContext(strapi, input.eventSlotDocumentId);

    if (!slot) {
      throw new Error('Timeslot not found');
    }

    const erpFields = toArray<any>(event.template?.formFields).filter((field) => field.visibleInErp !== false);
    const allowedFieldKeys = new Set(erpFields.map((field) => String(field.fieldKey ?? '')));
    const formValues = Object.fromEntries(
      Object.entries(input.formValues ?? {})
        .filter(([fieldKey]) => allowedFieldKeys.has(fieldKey))
        .map(([fieldKey, value]) => [fieldKey, typeof value === 'string' ? value.trim() : '']),
    );

    for (const field of erpFields) {
      if (field.required && !formValues[String(field.fieldKey ?? '')]) {
        throw new Error(`${field.labelEn ?? field.fieldKey ?? 'Registration field'} is required`);
      }
    }

    const participantName = formValues.participant_name || input.participantName;
    const staffNumber = formValues.staff_number || input.staffNumber;
    const medicalCardNumber = formValues.medical_card_number || input.medicalCardNumber;
    const hkidPrefix = formValues.hkid_prefix || input.hkidPrefix;
    const registeredEmail = formValues.registered_email || input.registeredEmail;
    const mobileNumber = formValues.mobile_number || input.mobileNumber;

    const identityHash = buildAppointmentIdentityHash({
      eventDocumentId: input.eventDocumentId,
      participantName,
      staffNumber,
    });

    const appointmentCandidates = (await fetchAppointmentList(strapi)).filter(
      (appointment) =>
        appointment.event?.documentId === input.eventDocumentId &&
        appointment.participantIdentityHash === identityHash &&
        getAppointmentStatus(appointment) === 'CONFIRMED',
    );

    if (appointmentCandidates.length > 0) {
      throw new Error('You have duplicated submission, please cancel your registered timeslot and re-register if you want to reschedule');
    }

    const created = (await strapi.documents('plugin::event-portal.appointment').create({
      data: {
        bookingReference: createBookingReference(),
        participantName,
        staffNumber,
        medicalCardNumber,
        hkidPrefix,
        registeredEmail,
        mobileNumber,
        communicationPreference: input.communicationPreference,
        appointmentStatus: 'CONFIRMED',
        appointmentDate: slot.eventDate,
        appointmentStartTime: slot.startTime,
        appointmentEndTime: slot.endTime,
        quotaSnapshot: slot.quota,
        cancelToken: createCancelToken(),
        submittedAt: nowIso(),
        portalSource: 'ERP',
        termsAccepted: input.termsAccepted,
        participantIdentityHash: identityHash,
        payload: {
          source: 'ERP',
          formValues,
        },
        event: input.eventDocumentId,
        eventSlot: input.eventSlotDocumentId,
      },
    })) as AnyRecord;

    await strapi.documents('plugin::event-portal.event-slot').update({
      documentId: input.eventSlotDocumentId,
      data: {
        usedCount: (slot.usedCount ?? 0) + 1,
        holdCount: Math.max((slot.holdCount ?? 0) - 1, 0),
      } as any,
    });

    await strapi.documents('plugin::event-portal.appointment-hold').update({
      documentId: hold.documentId,
      data: {
        appointmentHoldStatus: 'CONSUMED',
      } as any,
    });

    await createAuditLog(strapi, {
      entityType: 'appointment',
      entityDocumentId: created.documentId,
      appointmentDocumentId: created.documentId,
      eventDocumentId: input.eventDocumentId,
      action: 'BOOKED',
      actorEmail: registeredEmail,
      actorRole: 'ERP',
      details: {
        eventSlotDocumentId: input.eventSlotDocumentId,
      },
    });

    const destination =
      input.communicationPreference === 'SMS'
        ? mobileNumber
        : registeredEmail;

    if (destination) {
      await sendNotification(strapi, {
        channel: input.communicationPreference,
        to: destination,
        subject: 'Vaccination booking confirmed',
        body: `Your booking reference is ${created.bookingReference}.`,
      });
    }

    const hydrated = (await strapi.documents('plugin::event-portal.appointment').findOne({
      documentId: created.documentId,
      populate: {
        event: {
          populate: {
            userPartition: true,
          },
        },
        eventSlot: true,
      },
    })) as AnyRecord;

    return mapAppointment(hydrated);
  },

  async createEnquiry(input: { registeredEmail?: string; mobileNumber?: string }) {
    const value = input.registeredEmail?.trim() || input.mobileNumber?.trim();

    if (!value) {
      return {
        accepted: false,
        message: 'Your input information is not correct, please check.',
      };
    }

    const appointments = await fetchAppointmentList(strapi);

    const matches = appointments.filter((appointment) => {
      if (input.registeredEmail) {
        return appointment.registeredEmail === input.registeredEmail;
      }

      if (input.mobileNumber) {
        return appointment.mobileNumber === input.mobileNumber;
      }

      return false;
    });

    if (matches.length === 0) {
      return {
        accepted: false,
        message: 'Your input information is not correct, please check.',
      };
    }

    await sendNotification(strapi, {
      channel: input.mobileNumber ? 'SMS' : 'EMAIL',
      to: value,
      subject: 'Your vaccination booking information',
      body: matches
        .map((appointment) => {
          const link = `${publicBaseUrl()}/enquiry?cancelToken=${appointment.cancelToken ?? ''}&appointment=${appointment.documentId}`;
          return `${appointment.event?.eventName ?? 'Vaccination event'} — ${appointment.appointmentDate} ${appointment.appointmentStartTime}-${appointment.appointmentEndTime} — cancel: ${link}`;
        })
        .join('\n'),
    });

    return {
      accepted: true,
      message: 'Thanks for your enquiry, we will send out your booking information based on your selected receiving method.',
    };
  },

  async generateEventFromTemplate(documentId: string, actorEmail?: string) {
    const template = (await strapi.documents('plugin::event-portal.event-template').findOne({
      documentId,
      populate: {
        userPartitions: true,
        formFields: true,
      },
    })) as AnyRecord | null;

    if (!template) {
      throw new Error('Template not found');
    }

    void actorEmail;
    throw new Error('Template no longer contains event scheduling defaults. Create the event details directly in the event record instead.');
  },

  async publishEvent(documentId: string, actorEmail?: string) {
    const event = (await strapi.documents('plugin::event-portal.event').findOne({
      documentId,
      populate: {
        userPartition: true,
      },
    })) as AnyRecord | null;

    if (!event) {
      throw new Error('Event not found');
    }

    if (deriveEventStatus({ ...event, publishedToPortals: true }) === 'CLOSED') {
      throw new Error('Closed events cannot be published.');
    }

    await strapi.documents('plugin::event-portal.event').update({
      documentId,
      data: {
        eventStatus: 'RELEASED',
        publishedToPortals: true,
        releasedAt: nowIso(),
        releasedByEmail: actorEmail,
        lastModifiedByEmail: actorEmail,
      } as any,
    });

    await createAuditLog(strapi, {
      entityType: 'event',
      entityDocumentId: documentId,
      eventDocumentId: documentId,
      action: 'PUBLISHED',
      actorEmail,
      actorRole: 'EAP',
      details: {
        nextStatus: 'RELEASED',
        publishedToPortals: true,
      },
    });

    const detail = await fetchEventDetailRecord(strapi, documentId);
    return detail ? mapEventDetail(detail) : null;
  },

  async sendNotices(input: SendNoticesInput) {
    const templateDocumentId = String(input.noticeTemplateDocumentId ?? '').trim();
    const eventDocumentId = String(input.eventDocumentId ?? '').trim();
    const noticeType = String(input.noticeType ?? '').trim();
    const selectedAppointmentIds = Array.isArray(input.appointmentDocumentIds)
      ? input.appointmentDocumentIds.map((value) => String(value).trim()).filter(Boolean)
      : [];
    const batchSize = Math.max(1, Math.min(Number(input.batchSize ?? 50) || 50, 200));
    const event = eventDocumentId ? await fetchEventDetailRecord(strapi, eventDocumentId) : null;
    const resolvedTemplateDocumentId = templateDocumentId || String(resolveEventNoticeTemplate(event, noticeType)?.documentId ?? '').trim();

    if (!resolvedTemplateDocumentId) {
      throw new Error('The selected event notice type is not linked to a notice template.');
    }

    const template = await strapi.documents('plugin::event-portal.notice-template').findOne({
      documentId: resolvedTemplateDocumentId,
    }) as AnyRecord | null;

    if (!template) {
      throw new Error('Notice template not found.');
    }

    if (template.active === false) {
      throw new Error('Notice template is inactive.');
    }

    const appointments = await fetchAppointmentList(strapi);
    const recipients = appointments.filter((appointment) => {
      if (eventDocumentId && appointment.event?.documentId !== eventDocumentId) {
        return false;
      }

      if (selectedAppointmentIds.length > 0) {
        return selectedAppointmentIds.includes(String(appointment.documentId ?? ''));
      }

      return Boolean(eventDocumentId);
    });

    if (recipients.length === 0) {
      throw new Error('No appointments matched the selected send scope.');
    }

    let sentCount = 0;
    let failedCount = 0;
    const noticeDocumentIds: string[] = [];

    for (const chunk of chunkArray(recipients, batchSize)) {
      const results = await Promise.all(chunk.map((appointment) => createAndSendNotice(strapi, template, appointment)));

      for (const result of results) {
        noticeDocumentIds.push(result.documentId);
        if (result.status === 'SENT') {
          sentCount += 1;
        } else {
          failedCount += 1;
        }
      }
    }

    await createAuditLog(strapi, {
      entityType: 'notice-batch',
      entityDocumentId: resolvedTemplateDocumentId,
      eventDocumentId: eventDocumentId || undefined,
      action: 'NOTICE_BATCH_SENT',
      actorEmail: input.actorEmail,
      actorRole: 'EAP',
      details: {
        templateDocumentId: resolvedTemplateDocumentId,
        noticeType: noticeType || undefined,
        batchSize,
        recipientCount: recipients.length,
        sentCount,
        failedCount,
        noticeDocumentIds,
      },
    });

    return {
      accepted: true,
      templateDocumentId: resolvedTemplateDocumentId,
      eventDocumentId: eventDocumentId || undefined,
      noticeType: noticeType || undefined,
      recipientCount: recipients.length,
      sentCount,
      failedCount,
      noticeDocumentIds,
    };
  },

  async syncManagementEventSlots(documentId: string, input: unknown) {
    const event = await fetchEventDetailRecord(strapi, documentId);

    if (!event) {
      throw new Error('Event not found');
    }

    const plannedSlots = normalizeManagementEventSlots(input);
    const existingSlots = toArray<any>(event.slots);
    const plannedDocumentIds = new Set(plannedSlots.map((slot) => slot.documentId).filter(Boolean));

    for (const existingSlot of existingSlots) {
      if (typeof existingSlot.documentId === 'string' && existingSlot.documentId && !plannedDocumentIds.has(existingSlot.documentId)) {
        await strapi.documents('plugin::event-portal.event-slot').delete({
          documentId: existingSlot.documentId,
        });
      }
    }

    for (const slot of plannedSlots) {
      const data = {
        event: documentId,
        eventDate: slot.eventDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        enabled: slot.enabled,
        quota: slot.quota,
        usedCount: slot.usedCount,
        holdCount: slot.holdCount,
        sortOrder: slot.sortOrder,
      };

      if (slot.documentId) {
        await strapi.documents('plugin::event-portal.event-slot').update({
          documentId: slot.documentId,
          data: data as any,
        });
        continue;
      }

      await strapi.documents('plugin::event-portal.event-slot').create({
        data: data as any,
      });
    }

    const detail = await fetchEventDetailRecord(strapi, documentId);
    return detail ? mapEventDetail(detail) : null;
  },

  async unpublishEvent(documentId: string, actorEmail?: string) {
    const event = (await strapi.documents('plugin::event-portal.event').findOne({
      documentId,
    })) as AnyRecord | null;

    if (!event) {
      throw new Error('Event not found');
    }

    const nextStatus = deriveEventStatus({ ...event, publishedToPortals: false, eventStatus: 'DRAFT' });

    await strapi.documents('plugin::event-portal.event').update({
      documentId,
      data: {
        eventStatus: nextStatus,
        publishedToPortals: false,
        lastModifiedByEmail: actorEmail,
      } as any,
    });

    await createAuditLog(strapi, {
      entityType: 'event',
      entityDocumentId: documentId,
      eventDocumentId: documentId,
      action: 'UNPUBLISHED',
      actorEmail,
      actorRole: 'EAP',
      details: {
        nextStatus,
        publishedToPortals: false,
      },
    });

    const detail = await fetchEventDetailRecord(strapi, documentId);
    return detail ? mapEventDetail(detail) : null;
  },

  async disableEvent(documentId: string, actorEmail?: string) {
    const event = (await strapi.documents('plugin::event-portal.event').findOne({
      documentId,
    })) as AnyRecord | null;

    if (!event) {
      throw new Error('Event not found');
    }

    await strapi.documents('plugin::event-portal.event').update({
      documentId,
      data: {
        eventStatus: 'DISABLED',
        publishedToPortals: false,
        lastModifiedByEmail: actorEmail,
      } as any,
    });

    await createAuditLog(strapi, {
      entityType: 'event',
      entityDocumentId: documentId,
      eventDocumentId: documentId,
      action: 'DISABLED',
      actorEmail,
      actorRole: 'EAP',
      details: {
        nextStatus: 'DISABLED',
        publishedToPortals: false,
      },
    });

    const detail = await fetchEventDetailRecord(strapi, documentId);
    return detail ? mapEventDetail(detail) : null;
  },

  async cancelAppointment(
    documentId: string,
    actorEmail = 'system@local',
    actorRole = 'SYSTEM',
    reason?: string,
    cancelToken?: string,
  ) {
    const appointment = (await strapi.documents('plugin::event-portal.appointment').findOne({
      documentId,
      populate: {
        event: {
          populate: {
            userPartition: true,
          },
        },
        eventSlot: true,
      },
    })) as AnyRecord | null;

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (cancelToken && appointment.cancelToken && appointment.cancelToken !== cancelToken) {
      throw new Error('Invalid cancellation token');
    }

    if (getAppointmentStatus(appointment) === 'CANCELLED') {
      return mapAppointment(appointment);
    }

    await strapi.documents('plugin::event-portal.appointment').update({
      documentId,
      data: {
        appointmentStatus: 'CANCELLED',
        cancelledAt: nowIso(),
        cancelledByEmail: actorEmail,
        cancellationReason: reason,
      } as any,
    });

    if (appointment.eventSlot?.documentId) {
      await strapi.documents('plugin::event-portal.event-slot').update({
        documentId: appointment.eventSlot.documentId,
        data: {
          usedCount: Math.max((appointment.eventSlot.usedCount ?? 1) - 1, 0),
        } as any,
      });
    }

    await createAuditLog(strapi, {
      entityType: 'appointment',
      entityDocumentId: documentId,
      appointmentDocumentId: documentId,
      eventDocumentId: appointment.event?.documentId,
      action: 'CANCELLED',
      actorEmail,
      actorRole,
      details: {
        reason,
      },
    });

    const destination =
      appointment.communicationPreference === 'SMS'
        ? appointment.mobileNumber
        : appointment.registeredEmail;

    if (destination) {
      await sendNotification(strapi, {
        channel: appointment.communicationPreference === 'SMS' ? 'SMS' : 'EMAIL',
        to: destination,
        subject: 'Vaccination booking cancelled',
        body: `Your booking ${appointment.bookingReference} has been cancelled.`,
      });
    }

    const hydrated = (await strapi.documents('plugin::event-portal.appointment').findOne({
      documentId,
      populate: {
        event: {
          populate: {
            userPartition: true,
          },
        },
        eventSlot: true,
      },
    })) as AnyRecord;

    return mapAppointment(hydrated);
  },
});

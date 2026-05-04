import type {
  AppointmentDTO,
  ContactInfoDTO,
  DashboardDTO,
  EventDetailDTO,
  EventListItemDTO,
  EventTemplateDTO,
  FormFieldConfigDTO,
  NotificationType,
  NoticeDTO,
  NoticeTemplateDTO,
  PortalDocumentDTO,
  UserAccountDTO,
  UserGroupDTO,
  UserPartitionDTO,
} from '@event-portal/contracts';
import { eventPortalQueries, eventPortalSdk, type EventPortalFieldConfigComponent, type EventPortalMandatoryFieldEntity } from './event-portal-sdk';

type AnyRecord = Record<string, any>;

function toArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function getStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined;
}

function getStatus(record: AnyRecord, key: string) {
  return record[key] ?? record.status;
}

function formatTimeForInput(value: string | undefined) {
  if (!value) {
    return '';
  }

  return value.slice(0, 5);
}

function getOptionalBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined;
}

function mapNotificationTemplate(type: NotificationType, noticeTemplate: AnyRecord | null | undefined) {
  if (!noticeTemplate) {
    return undefined;
  }

  return {
    type,
    templateDocumentId: noticeTemplate.documentId,
    templateName: noticeTemplate.name,
    channel: noticeTemplate.channel,
    subject: noticeTemplate.subject,
    enabled: true,
  };
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}

function mapMedia(record: AnyRecord | null | undefined) {
  if (!record?.url) {
    return undefined;
  }

  return {
    documentId: record.documentId,
    name: record.name ?? 'uploaded-file',
    url: record.url,
    alternativeText: record.alternativeText,
    width: record.width,
    height: record.height,
  };
}

function mapField(record: Partial<EventPortalFieldConfigComponent> & { key?: string }): FormFieldConfigDTO {
  return {
    fieldKey: record.fieldKey ?? record.key ?? '',
    labelEn: record.labelEn ?? '',
    labelZh: record.labelZh,
    fieldType: record.fieldType ?? 'TEXT',
    required: Boolean(record.required),
    visibleInERP: record.visibleInErp !== false,
    visibleInECP: record.visibleInEcp !== false,
    visibleInEAP: record.visibleInEap !== false,
    sortOrder: record.sortOrder ?? 0,
    isSystem: Boolean(record.isSystem),
    placeholderEn: record.placeholderEn,
    placeholderZh: record.placeholderZh,
    options: getStringArray(record.optionsJson),
  };
}

function mapMandatoryField(record: EventPortalMandatoryFieldEntity): FormFieldConfigDTO {
  return {
    fieldKey: record.key,
    labelEn: record.labelEn,
    labelZh: record.labelZh,
    fieldType: record.fieldType,
    required: Boolean(record.required),
    visibleInERP: true,
    visibleInECP: true,
    visibleInEAP: true,
    sortOrder: record.sortOrder ?? 0,
    isSystem: true,
    placeholderEn: record.placeholderEn,
    placeholderZh: record.placeholderZh,
    options: getStringArray(record.optionsJson),
  };
}

function mapPartition(record: AnyRecord): UserPartitionDTO {
  const userGroup = record.userGroup ? [record.userGroup] : [];

  return {
    documentId: record.documentId,
    code: record.code,
    description: record.description,
    slug: record.slug,
    status: getStatus(record, 'userPartitionStatus'),
    remarks: record.remarks,
    groupCompanyName: userGroup[0]?.companyName,
    userGroupCodes: userGroup.map((group) => group.code).filter(Boolean),
    userGroupDocumentIds: userGroup.map((group) => group.documentId).filter(Boolean),
    templateDocumentId: record.template?.documentId,
    templateName: record.template?.name,
    logo: mapMedia(record.logo),
    banners: toArray<any>(record.banners).map((banner) => mapMedia(banner)).filter(isDefined),
  };
}

function mapGroup(record: AnyRecord): UserGroupDTO {
  const partitions = toArray<any>(record.partitions);
  const portalUsers = toArray<any>(record.portalUsers);

  return {
    documentId: record.documentId,
    code: record.code,
    description: record.description,
    companyName: record.companyName,
    remarks: record.remarks,
    status: getStatus(record, 'userGroupStatus'),
    logo: mapMedia(record.logo),
    partitionCodes: partitions.map((partition) => partition.code).filter(Boolean),
    partitionDocumentIds: partitions.map((partition) => partition.documentId).filter(Boolean),
    portalUserDocumentIds: portalUsers.map((user) => user.documentId).filter(Boolean),
    portalUsers: portalUsers.map((user) => ({
      documentId: user.documentId,
      username: user.username ?? user.email ?? '',
      email: user.email ?? '',
      status: user.blocked ? 'DISABLED' : 'ACTIVE',
      portalRole: user.portalRole ?? 'CLIENT_HR',
    })),
  };
}

function mapUserAccount(record: AnyRecord): UserAccountDTO {
  const portalRole = record.portalRole ?? 'CLIENT_HR';
  const userGroups = portalRole === 'CLIENT_HR' ? toArray<any>(record.userGroups) : [];

  return {
    documentId: record.documentId,
    username: record.username ?? record.email,
    email: record.email,
    status: record.blocked ? 'DISABLED' : 'ACTIVE',
    portalRole,
    confirmed: record.confirmed,
    provider: record.provider,
    roleName: record.role?.name,
    roleType: record.role?.type,
    lastLoginAt: record.lastLoginAt,
    userGroupCodes: userGroups.map((group) => group.code).filter(Boolean),
    userGroupDocumentIds: userGroups.map((group) => group.documentId).filter(Boolean),
  };
}

function mapTemplate(record: AnyRecord): EventTemplateDTO {
  const fields = toArray<any>(record.formFields).map((field) => mapField(field));
  const partitions = toArray<any>(record.userPartitions ?? (record.userPartition ? [record.userPartition] : []));

  return {
    documentId: record.documentId,
    name: record.name,
    description: record.description,
    partitionCodes: partitions.map((partition) => partition.code).filter(Boolean),
    partitionDocumentIds: partitions.map((partition) => partition.documentId).filter(Boolean),
    fieldCount: fields.length,
    fields,
  };
}

function mapNoticeTemplate(record: AnyRecord): NoticeTemplateDTO {
  return {
    documentId: record.documentId,
    name: record.name,
    description: record.description,
    channel: record.channel,
    subject: record.subject,
    plainTextBody: record.plainTextBody ?? '',
    htmlBody: record.htmlBody,
    active: record.active !== false,
    sortOrder: record.sortOrder ?? 0,
  };
}

function mapNotice(record: AnyRecord): NoticeDTO {
  return {
    documentId: record.documentId,
    templateDocumentId: record.noticeTemplate?.documentId,
    templateName: record.noticeTemplate?.name,
    appointmentDocumentId: record.appointment?.documentId,
    bookingReference: record.appointment?.bookingReference,
    eventDocumentId: record.event?.documentId ?? record.appointment?.event?.documentId,
    eventName: record.event?.eventName ?? record.appointment?.event?.eventName,
    participantName: record.appointment?.participantName,
    channel: record.channel,
    recipient: record.recipient,
    subject: record.subject,
    plainTextBody: record.plainTextBody ?? '',
    htmlBody: record.htmlBody,
    status: getStatus(record, 'noticeStatus'),
    errorMessage: record.errorMessage,
    sentAt: record.sentAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapEventSlotsToDates(slots: AnyRecord[]) {
  const grouped = new Map<string, AnyRecord[]>();

  for (const slot of slots) {
    const dateKey = String(slot.eventDate ?? '');

    if (!dateKey) {
      continue;
    }

    const current = grouped.get(dateKey) ?? [];
    current.push(slot);
    grouped.set(dateKey, current);
  }

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, dateSlots]) => ({
      documentId: date,
      date,
      enabled: dateSlots.some((slot) => slot.enabled !== false),
      slots: dateSlots
        .slice()
        .sort((left, right) => String(left.startTime).localeCompare(String(right.startTime)))
        .map((slot) => ({
          documentId: slot.documentId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          enabled: Boolean(slot.enabled),
          quota: slot.quota ?? 0,
          usedCount: slot.usedCount ?? 0,
          holdCount: slot.holdCount ?? 0,
          remaining: Math.max(0, (slot.quota ?? 0) - (slot.usedCount ?? 0) - (slot.holdCount ?? 0)),
        })),
    }));
}

function buildEventPaths(record: AnyRecord) {
  const eventCode = record.publicSlug ?? record.documentId;
  const partitionCode = record.userPartition?.code ?? '';
  const publicPath = `/p/${partitionCode}/e/${eventCode}`;

  return {
    eventCode,
    partitionCode,
    publicUrl: publicPath,
    qrPayload: publicPath,
  };
}

function mapEventListItem(record: AnyRecord): EventListItemDTO {
  const paths = buildEventPaths(record);

  return {
    documentId: record.documentId,
    eventCode: paths.eventCode,
    companyName: record.companyName,
    location: record.location,
    eventName: record.eventName,
    description: record.eventDescription,
    notes: record.eventNotes,
    partitionCode: paths.partitionCode,
    partitionDocumentId: record.userPartition?.documentId,
    templateDocumentId: record.template?.documentId,
    status: getStatus(record, 'eventStatus'),
    registrationStartDate: record.registrationStartDate,
    registrationEndDate: record.registrationEndDate,
    eventStartDate: record.eventStartDate,
    eventEndDate: record.eventEndDate,
    dayStartTime: formatTimeForInput(record.dayStartTime),
    dayEndTime: formatTimeForInput(record.dayEndTime),
    showInRegistrationPeriod: getOptionalBoolean(record.showInRegistrationPeriod),
    showInEventPeriod: getOptionalBoolean(record.showInEventPeriod),
    showInExpired: getOptionalBoolean(record.showInExpired),
    reminderOffsetDays: record.reminderOffsetDays ?? 2,
    publishedToPortals: record.publishedToPortals === true,
    publicUrl: paths.publicUrl,
    qrPayload: paths.qrPayload,
  };
}

function mapEventDetail(record: AnyRecord): EventDetailDTO {
  const notifications = [
    mapNotificationTemplate('REGISTRATION', record.registrationNoticeTemplate),
    mapNotificationTemplate('ANNOUNCEMENT', record.announcementNoticeTemplate),
    mapNotificationTemplate('EVENT_UPDATE', record.eventUpdateNoticeTemplate),
  ].filter((value): value is NonNullable<typeof value> => Boolean(value));

  return {
    event: {
      ...mapEventListItem(record),
      fields: toArray<any>(record.template?.formFields).map((field) => mapField(field)),
      dates: mapEventSlotsToDates(toArray<any>(record.slots)),
      notifications,
    },
  };
}

function mapAppointment(record: AnyRecord): AppointmentDTO {
  return {
    documentId: record.documentId,
    bookingReference: record.bookingReference,
    eventDocumentId: record.event?.documentId ?? '',
    eventName: record.event?.eventName ?? '',
    companyName: record.event?.companyName ?? '',
    participantName: record.participantName,
    staffNumber: record.staffNumber,
    medicalCardNumber: record.medicalCardNumber,
    hkidPrefix: record.hkidPrefix,
    registeredEmail: record.registeredEmail,
    mobileNumber: record.mobileNumber,
    communicationPreference: record.communicationPreference,
    status: getStatus(record, 'appointmentStatus'),
    appointmentDate: record.appointmentDate,
    appointmentStartTime: record.appointmentStartTime,
    appointmentEndTime: record.appointmentEndTime,
    quota: record.quotaSnapshot ?? record.eventSlot?.quota ?? 0,
    remainingAfterBooking: record.eventSlot
      ? Math.max(0, (record.eventSlot.quota ?? 0) - (record.eventSlot.usedCount ?? 0) - (record.eventSlot.holdCount ?? 0))
      : undefined,
    cancelToken: record.cancelToken,
    portalSource: record.portalSource,
  };
}

function mapDocument(record: AnyRecord): PortalDocumentDTO {
  return {
    documentId: record.documentId,
    titleEn: record.titleEn,
    titleZh: record.titleZh,
    descriptionEn: record.descriptionEn,
    descriptionZh: record.descriptionZh,
    portalTargets: record.portalTargets ?? [],
    sortOrder: record.sortOrder ?? 0,
    active: record.active !== false,
    fileName: record.file?.name ?? 'uploaded-file',
    downloadUrl: record.file?.url,
    partitionDocumentId: record.userPartition?.documentId,
    partitionCode: record.userPartition?.code,
  };
}

function mapContact(record: AnyRecord): ContactInfoDTO {
  return {
    documentId: record.documentId,
    titleEn: record.titleEn,
    titleZh: record.titleZh,
    descriptionEn: record.descriptionEn,
    descriptionZh: record.descriptionZh,
    email: record.email,
    phone: record.phone,
    addressEn: record.addressEn,
    addressZh: record.addressZh,
    portalTargets: record.portalTargets ?? [],
    sortOrder: record.sortOrder ?? 0,
    active: record.active !== false,
    partitionDocumentId: record.userPartition?.documentId,
    partitionCode: record.userPartition?.code,
  };
}

async function withFallback<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch {
    return fallback;
  }
}

function getDefaultDashboard(): DashboardDTO {
  return {
    headline: 'Event admin overview',
    stats: [
      { label: 'Partitions', value: '0', helper: 'Public ERP entry scopes' },
      { label: 'Templates', value: '0', helper: 'Reusable form blueprints' },
      { label: 'Events', value: '0', helper: 'Released and draft event records' },
      { label: 'Appointments', value: '0', helper: 'Cross-portal booking records' },
      { label: 'Users', value: '0', helper: 'Login-enabled users-permissions users' },
    ],
  };
}

export async function getDashboard(): Promise<DashboardDTO> {
  return withFallback(async () => {
    const [partitionRows, templateRows, eventRows, appointmentRows, profileRows] = await Promise.all([
      getPartitions(),
      getTemplates(),
      getEvents(),
      getAppointments(),
      getUserAccounts(),
    ]);

    return {
      headline: 'Event admin overview',
      stats: [
        { label: 'Partitions', value: String(partitionRows.length), helper: 'Public ERP entry scopes' },
        { label: 'Templates', value: String(templateRows.length), helper: 'Reusable form blueprints' },
        { label: 'Events', value: String(eventRows.length), helper: 'Released and draft event records' },
        { label: 'Appointments', value: String(appointmentRows.length), helper: 'Cross-portal booking records' },
        { label: 'Users', value: String(profileRows.length), helper: 'Login-enabled users-permissions users' },
      ],
    };
  }, getDefaultDashboard());
}

export async function getPartitions(): Promise<UserPartitionDTO[]> {
  const response = await eventPortalSdk.userPartitions.findMany(eventPortalQueries.partitionList());

  return response.data.map(mapPartition);
}

export async function getPartition(documentId: string): Promise<UserPartitionDTO | undefined> {
  const response = await eventPortalSdk.userPartitions.findOne(documentId, eventPortalQueries.partitionDetail());

  return mapPartition(response.data);
}

export async function getGroups(): Promise<UserGroupDTO[]> {
  const response = await eventPortalSdk.userGroups.findMany(
    {
      populate: { logo: true, partitions: true, portalUsers: true },
      sort: ['code:asc'],
    },
  );

  return response.data.map(mapGroup);
}

export async function getGroup(documentId: string): Promise<UserGroupDTO | undefined> {
  const response = await eventPortalSdk.userGroups.findOne(documentId, {
    populate: { logo: true, partitions: true, portalUsers: true },
  });

  return mapGroup(response.data);
}

export async function getGroupByCode(code: string): Promise<UserGroupDTO | undefined> {
  try {
    const response = await eventPortalSdk.userGroups.findMany(
      {
        filters: { code: { $eq: code } },
        populate: { logo: true, partitions: true, portalUsers: true },
        limit: 1,
      },
      {
        cache: 'no-store',
        revalidate: false,
      },
    );

    return response.data[0] ? mapGroup(response.data[0]) : undefined;
  } catch {
    return undefined;
  }
}

export async function getUserAccounts(): Promise<UserAccountDTO[]> {
  const response = await eventPortalSdk.users.findMany({
    sort: ['username:asc', 'email:asc'],
  });

  return response.data.map(mapUserAccount);
}

export async function getUserAccount(documentId: string): Promise<UserAccountDTO | undefined> {
  const response = await eventPortalSdk.users.findOne(documentId);
  return mapUserAccount(response.data);
}

export async function getMandatoryFieldLibrary(): Promise<FormFieldConfigDTO[]> {
  const response = await eventPortalSdk.mandatoryFields.findMany({
    filters: { isActive: true },
    sort: ['sortOrder:asc', 'labelEn:asc'],
  });

  return response.data.map(mapMandatoryField);
}

export async function getTemplates(): Promise<EventTemplateDTO[]> {
  const response = await eventPortalSdk.eventTemplates.findMany(eventPortalQueries.templateList());

  return response.data.map(mapTemplate);
}

export async function getTemplate(documentId: string): Promise<EventTemplateDTO | undefined> {
  const response = await eventPortalSdk.eventTemplates.findOne(documentId, eventPortalQueries.templateDetail());

  return mapTemplate(response.data);
}

export async function getNoticeTemplates(): Promise<NoticeTemplateDTO[]> {
  return withFallback(async () => {
    const response = await eventPortalSdk.noticeTemplates.findMany({
      sort: ['sortOrder:asc', 'name:asc'],
    });

    return response.data.map(mapNoticeTemplate);
  }, []);
}

export async function getNoticeTemplate(documentId: string): Promise<NoticeTemplateDTO | undefined> {
  return withFallback(async () => {
    const response = await eventPortalSdk.noticeTemplates.findOne(documentId);
    return mapNoticeTemplate(response.data);
  }, undefined);
}

export async function getNotices(): Promise<NoticeDTO[]> {
  return withFallback(async () => {
    const response = await eventPortalSdk.notices.findMany({
      populate: {
        noticeTemplate: true,
        appointment: {
          populate: {
            event: true,
          },
        },
        event: true,
      },
      sort: ['createdAt:desc'],
    });

    return response.data.map(mapNotice);
  }, []);
}

export async function getNotice(documentId: string): Promise<NoticeDTO | undefined> {
  return withFallback(async () => {
    const response = await eventPortalSdk.notices.findOne(documentId, {
      populate: {
        noticeTemplate: true,
        appointment: {
          populate: {
            event: true,
          },
        },
        event: true,
      },
    });

    return mapNotice(response.data);
  }, undefined);
}

export async function getEvents(): Promise<EventListItemDTO[]> {
  const response = await eventPortalSdk.events.findMany(
    {
      populate: {
        userPartition: true,
        template: true,
      },
      sort: ['eventStartDate:asc', 'eventName:asc'],
    },
  );

  return response.data.map((record) => mapEventListItem(record));
}

export async function getEvent(documentId: string): Promise<EventDetailDTO | undefined> {
  return withFallback(async () => {
    const response = await eventPortalSdk.events.findOne(documentId, {
      populate: {
        userPartition: true,
        template: {
          populate: {
            formFields: true,
          },
        },
        registrationNoticeTemplate: true,
        announcementNoticeTemplate: true,
        eventUpdateNoticeTemplate: true,
        slots: true,
      },
    });

    return mapEventDetail(response.data);
  }, undefined);
}

export async function getAppointments(): Promise<AppointmentDTO[]> {
  const response = await eventPortalSdk.appointments.findMany(
    {
      populate: {
        event: {
          populate: {
            userPartition: true,
          },
        },
        eventSlot: true,
      },
      sort: ['appointmentDate:desc', 'appointmentStartTime:desc'],
    },
  );

  return response.data.map(mapAppointment);
}

export async function getAppointment(documentId: string): Promise<AppointmentDTO | undefined> {
  const response = await eventPortalSdk.appointments.findOne(documentId, {
    populate: {
      event: {
        populate: {
          userPartition: true,
        },
      },
      eventSlot: true,
    },
  });

  return mapAppointment(response.data);
}

export async function getDocuments(): Promise<PortalDocumentDTO[]> {
  return withFallback(async () => {
    const response = await eventPortalSdk.portalDocuments.findMany(
      {
        populate: {
          file: true,
          userPartition: true,
        },
        sort: ['sortOrder:asc', 'titleEn:asc'],
      },
    );

    return response.data.map(mapDocument);
  }, []);
}

export async function getDocument(documentId: string): Promise<PortalDocumentDTO | undefined> {
  return withFallback(async () => {
    const response = await eventPortalSdk.portalDocuments.findOne(documentId, {
      populate: {
        file: true,
        userPartition: true,
      },
    });

    return mapDocument(response.data);
  }, undefined);
}

export async function getContacts(): Promise<ContactInfoDTO[]> {
  return withFallback(async () => {
    const response = await eventPortalSdk.contactInfos.findMany(
      {
        populate: {
          userPartition: true,
        },
        sort: ['sortOrder:asc', 'titleEn:asc'],
      },
    );

    return response.data.map(mapContact);
  }, []);
}

export async function getContact(documentId: string): Promise<ContactInfoDTO | undefined> {
  return withFallback(async () => {
    const response = await eventPortalSdk.contactInfos.findOne(documentId, {
      populate: {
        userPartition: true,
      },
    });

    return mapContact(response.data);
  }, undefined);
}

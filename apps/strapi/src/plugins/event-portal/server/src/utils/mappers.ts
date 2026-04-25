import { calculateRemaining } from './slot-capacity';

type AnyRecord = Record<string, any>;

function toArray<T = any>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function formatTimeForInput(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();

  if (/^\d{2}:\d{2}:\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 5);
  }

  return trimmed;
}

function getPublicAppBaseUrl(record: AnyRecord) {
  const configured = process.env.PUBLIC_FRONTEND_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (typeof record.publicBaseUrl === 'string' && /^https?:\/\//.test(record.publicBaseUrl.trim())) {
    return record.publicBaseUrl.trim().replace(/\/$/, '');
  }

  return 'http://localhost:3002';
}

function mapNotificationTemplate(type: string, noticeTemplate: AnyRecord | null | undefined) {
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

function getStatus(record: AnyRecord, key: string) {
  return record[key] ?? record.status;
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

export function mapPartition(record: AnyRecord) {
  const userGroup = record.userGroup ? [record.userGroup] : [];

  return {
    documentId: record.documentId,
    code: record.code,
    description: record.description,
    slug: record.slug,
    status: getStatus(record, 'userPartitionStatus'),
    remarks: record.remarks,
    groupCompanyName: userGroup[0]?.companyName,
    userGroupCodes: userGroup.map((group: any) => group.code).filter(Boolean),
    templateDocumentId: record.template?.documentId,
    templateName: record.template?.name,
    logo: mapMedia(record.logo),
    banners: toArray<any>(record.banners).map((banner: any) => mapMedia(banner)).filter(isDefined),
  };
}

export function mapGroup(record: AnyRecord) {
  return {
    documentId: record.documentId,
    code: record.code,
    description: record.description,
    companyName: record.companyName,
    remarks: record.remarks,
    status: getStatus(record, 'userGroupStatus'),
    logo: mapMedia(record.logo),
    partitionCodes: toArray<any>(record.partitions).map((partition: any) => partition.code),
    partitionDocumentIds: toArray<any>(record.partitions).map((partition: any) => partition.documentId),
    portalUserDocumentIds: toArray<any>(record.portalUsers).map((user: any) => user.documentId),
    portalUsers: toArray<any>(record.portalUsers).map((user: any) => ({
      documentId: user.documentId,
      username: user.username ?? user.email,
      email: user.email,
      status: user.blocked ? 'DISABLED' : 'ACTIVE',
      portalRole: user.portalRole ?? 'CLIENT_HR',
    })),
  };
}

export function mapUser(record: AnyRecord) {
  const portalRole = record.portalRole ?? 'CLIENT_HR';
  const userGroups = portalRole === 'CLIENT_HR' ? toArray<any>(record.userGroups) : [];

  return {
    documentId: record.documentId,
    username: record.username ?? record.email,
    email: record.email,
    status: record.blocked ? 'DISABLED' : 'ACTIVE',
    portalRole,
    lastLoginAt: record.lastLoginAt,
    userGroupCodes: userGroups.map((group: any) => group.code).filter(Boolean),
    userGroupDocumentIds: userGroups.map((group: any) => group.documentId).filter(Boolean),
  };
}

export function mapField(record: AnyRecord) {
  return {
    fieldKey: record.fieldKey,
    labelEn: record.labelEn,
    labelZh: record.labelZh,
    fieldType: record.fieldType,
    required: Boolean(record.required),
    visibleInERP: record.visibleInErp !== false,
    visibleInECP: record.visibleInEcp !== false,
    visibleInEAP: record.visibleInEap !== false,
    sortOrder: record.sortOrder ?? 0,
    isSystem: Boolean(record.isSystem),
    placeholderEn: record.placeholderEn,
    placeholderZh: record.placeholderZh,
    options: record.optionsJson,
  };
}

export function mapTemplate(record: AnyRecord) {
  const fields = toArray<any>(record.formFields).map((field: any) => mapField(field));
  const partitions = toArray<any>(record.userPartitions ?? (record.userPartition ? [record.userPartition] : []));

  return {
    documentId: record.documentId,
    name: record.name,
    description: record.description,
    partitionCodes: partitions.map((partition: any) => partition.code).filter(Boolean),
    partitionDocumentIds: partitions.map((partition: any) => partition.documentId).filter(Boolean),
    fieldCount: fields.length,
    fields,
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
      enabled: dateSlots.some((slot: any) => slot.enabled !== false),
      slots: dateSlots
        .slice()
        .sort((left: any, right: any) => String(left.startTime).localeCompare(String(right.startTime)))
        .map((slot: any) => ({
          documentId: slot.documentId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          enabled: Boolean(slot.enabled),
          quota: slot.quota ?? 0,
          usedCount: slot.usedCount ?? 0,
          holdCount: slot.holdCount ?? 0,
          remaining: calculateRemaining(slot),
        })),
    }));
}

export function mapEventListItem(record: AnyRecord) {
  const eventCode = record.publicSlug ?? record.documentId;
  const partitionCode = record.userPartition?.code ?? '';
  const publicPath = `/p/${partitionCode}/e/${eventCode}`;

  return {
    documentId: record.documentId,
    eventCode,
    companyName: record.companyName,
    location: record.location,
    eventName: record.eventName,
    description: record.eventDescription,
    notes: record.eventNotes,
    partitionCode,
    status: getStatus(record, 'eventStatus'),
    registrationStartDate: record.registrationStartDate,
    registrationEndDate: record.registrationEndDate,
    eventStartDate: record.eventStartDate,
    eventEndDate: record.eventEndDate,
    dayStartTime: formatTimeForInput(record.dayStartTime),
    dayEndTime: formatTimeForInput(record.dayEndTime),
    showInRegistrationPeriod: record.showInRegistrationPeriod !== false,
    showInEventPeriod: record.showInEventPeriod !== false,
    showInExpired: record.showInExpired === true,
    reminderOffsetDays: record.reminderOffsetDays ?? 2,
    publishedToPortals: record.publishedToPortals === true,
    publicUrl: publicPath,
    qrPayload: publicPath,
  };
}

export function mapEventDetail(record: AnyRecord) {
  const notifications = [
    mapNotificationTemplate('REGISTRATION', record.registrationNoticeTemplate),
    mapNotificationTemplate('ANNOUNCEMENT', record.announcementNoticeTemplate),
    mapNotificationTemplate('EVENT_UPDATE', record.eventUpdateNoticeTemplate),
  ].filter((value): value is NonNullable<typeof value> => Boolean(value));

  return {
    event: {
      ...mapEventListItem(record),
      fields: toArray<any>(record.template?.formFields).map((field: any) => mapField(field)),
      dates: mapEventSlotsToDates(toArray<any>(record.slots)),
      notifications,
    },
  };
}

export function mapAppointment(record: AnyRecord) {
  return {
    documentId: record.documentId,
    bookingReference: record.bookingReference,
    eventDocumentId: record.event?.documentId,
    eventName: record.event?.eventName,
    companyName: record.event?.companyName,
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
    remainingAfterBooking: record.eventSlot ? calculateRemaining(record.eventSlot) : undefined,
    cancelToken: record.cancelToken,
    portalSource: record.portalSource,
  };
}

export function mapDocument(record: AnyRecord) {
  return {
    documentId: record.documentId,
    titleEn: record.titleEn,
    titleZh: record.titleZh,
    portalTargets: record.portalTargets ?? [],
    fileName: record.file?.name ?? 'uploaded-file',
    downloadUrl: record.file?.url,
    partitionCode: record.userPartition?.code,
  };
}

export function mapContact(record: AnyRecord) {
  return {
    documentId: record.documentId,
    titleEn: record.titleEn,
    titleZh: record.titleZh,
    email: record.email,
    phone: record.phone,
    addressEn: record.addressEn,
    addressZh: record.addressZh,
    portalTargets: record.portalTargets ?? [],
    partitionCode: record.userPartition?.code,
  };
}

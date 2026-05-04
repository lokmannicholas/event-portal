'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import type {
  AppointmentStatus,
  CommunicationPreference,
  EventStatus,
  GroupStatus,
  PortalRole,
} from '@event-portal/contracts';
import { StrapiRequestError, eventPortalSdk } from '../../lib/event-portal-sdk';
import { eventPortalQueries } from '../../lib/event-portal-sdk';
import { clearCreateDraft, persistCreateDraft, type EapCreateDraftKind } from '../../lib/eap-create-drafts';
import { getAppBaseUrl } from '../../lib/app-base-url';
import { getNoticeQueryString, eapRecordConfig, type EapRecordKind, getRecordCreatePath, getRecordDetailPath } from '../../lib/eap-records';
import { getStrapiBaseUrl } from '../../lib/strapi-base-url';
import { getServerStrapiRequestToken } from '../../lib/strapi-request-token';
import { normalizeTemplateFields, type TemplateFieldFormValue } from '../../lib/template-form-fields';
import type { EventPortalEventSlotPayload } from '../../lib/event-portal-types';

type EventSlotPlanRow = {
  id: string;
  documentId?: string;
  date: string;
  startTime: string;
  endTime: string;
  quota: number;
  usedCount?: number;
  holdCount?: number;
  enabled?: boolean;
};

type EventRelationValue = {
  documentId?: string;
} | null | undefined;

type UploadedMediaFile = {
  id?: number;
  documentId?: string;
  name?: string;
};

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function getOptionalValue(formData: FormData, key: string) {
  const value = getValue(formData, key);
  return value || undefined;
}

function getNullableValue(formData: FormData, key: string) {
  const value = getValue(formData, key);
  return value || null;
}

function getRelationDocumentId(value: EventRelationValue) {
  return typeof value?.documentId === 'string' && value.documentId.trim() ? value.documentId : undefined;
}

function isDuplicatedEventSlot(value: unknown): value is EventPortalEventSlotPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const slot = value as Partial<EventPortalEventSlotPayload>;

  return (
    typeof slot.eventDate === 'string' &&
    typeof slot.startTime === 'string' &&
    typeof slot.endTime === 'string' &&
    typeof slot.quota === 'number'
  );
}

function getUserGroupRelationValues(formData: FormData) {
  const portalRole = getValue(formData, 'portalRole') as PortalRole;

  if (portalRole === 'ADMIN') {
    return [];
  }

  return getRelationValues(formData, 'userGroupDocumentIds');
}

function getNumberValue(formData: FormData, key: string) {
  return Number(getValue(formData, key));
}

function getBooleanValue(formData: FormData, key: string, defaultValue = false) {
  const value = formData.get(key);

  if (typeof value !== 'string') {
    return defaultValue;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return defaultValue;
}

function getOptionalBooleanValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

function getPublishedToPortalsForStatus(status: EventStatus) {
  return status === 'RELEASED' || status === 'CLOSED';
}

function getRelationValues(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeStrapiTimeValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return trimmed;
  }

  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  if (/^\d{2}:\d{2}:\d{2}\.\d{3}$/.test(trimmed)) {
    return trimmed.slice(0, 8);
  }

  return trimmed;
}

function getCreateDraftKind(kind: EapRecordKind): EapCreateDraftKind | undefined {
  if (kind === 'event' || kind === 'template') {
    return kind;
  }

  return undefined;
}

function buildCreateDraft(kind: EapCreateDraftKind, formData: FormData) {
  switch (kind) {
    case 'event':
      return {
        eventName: getValue(formData, 'eventName'),
        eventCode: getValue(formData, 'eventCode'),
        companyName: getValue(formData, 'companyName'),
        location: getValue(formData, 'location'),
        partitionDocumentId: getOptionalValue(formData, 'partitionDocumentId'),
        templateDocumentId: getOptionalValue(formData, 'templateDocumentId'),
        status: getOptionalValue(formData, 'status'),
        registrationStartDate: getOptionalValue(formData, 'registrationStartDate'),
        registrationEndDate: getOptionalValue(formData, 'registrationEndDate'),
        eventStartDate: getOptionalValue(formData, 'eventStartDate'),
        eventEndDate: getOptionalValue(formData, 'eventEndDate'),
        dayStartTime: getOptionalValue(formData, 'dayStartTime'),
        dayEndTime: getOptionalValue(formData, 'dayEndTime'),
        showInRegistrationPeriod: getValue(formData, 'showInRegistrationPeriod'),
        showInEventPeriod: getValue(formData, 'showInEventPeriod'),
        showInExpired: getValue(formData, 'showInExpired'),
        reminderOffsetDays: getOptionalValue(formData, 'reminderOffsetDays'),
        description: getOptionalValue(formData, 'description'),
        notes: getOptionalValue(formData, 'notes'),
        registrationNoticeTemplateDocumentId: getOptionalValue(formData, 'registrationNoticeTemplateDocumentId'),
        announcementNoticeTemplateDocumentId: getOptionalValue(formData, 'announcementNoticeTemplateDocumentId'),
        eventUpdateNoticeTemplateDocumentId: getOptionalValue(formData, 'eventUpdateNoticeTemplateDocumentId'),
        slotPlanJson: getOptionalValue(formData, 'slotPlanJson'),
      };
    case 'template':
      return {
        name: getValue(formData, 'name'),
        description: getOptionalValue(formData, 'description'),
        partitionDocumentIds: getRelationValues(formData, 'partitionDocumentIds'),
        formFieldsJson: getOptionalValue(formData, 'formFieldsJson'),
      };
  }
}

function isFileValue(value: FormDataEntryValue | null): value is File {
  return typeof File !== 'undefined' && value instanceof File;
}

function getFileValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (!isFileValue(value) || value.size === 0) {
    return undefined;
  }

  return value;
}

function getFileValues(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is File => isFileValue(value) && value.size > 0);
}

function getMediaIdentifier(record: UploadedMediaFile) {
  if (typeof record.documentId === 'string' && record.documentId.trim()) {
    return record.documentId.trim();
  }

  if (typeof record.id === 'number') {
    return String(record.id);
  }

  throw new Error('Uploaded media did not return a usable identifier.');
}

function getMediaInput(record: UploadedMediaFile) {
  if (typeof record.id === 'number') {
    return record.id;
  }

  if (typeof record.documentId === 'string' && record.documentId.trim()) {
    return record.documentId.trim();
  }

  return getMediaIdentifier(record);
}

async function uploadMediaFiles(files: File[]) {
  if (files.length === 0) {
    return [];
  }

  console.log(
    '[eap] upload media files request',
    files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    })),
  );

  const token = await getServerStrapiRequestToken();
  const uploadFormData = new FormData();

  for (const file of files) {
    uploadFormData.append('files', file, file.name);
  }

  const response = await fetch(`${getStrapiBaseUrl()}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: uploadFormData,
  });

  const parsed = (await response.json().catch(() => undefined)) as { error?: { message?: string } } | UploadedMediaFile[] | undefined;

  if (!response.ok) {
    console.error('[eap] upload media files failed', {
      status: response.status,
      statusText: response.statusText,
      body: parsed,
    });

    const message =
      parsed && !Array.isArray(parsed) && typeof parsed.error?.message === 'string'
        ? parsed.error.message
        : 'Failed to upload media files.';
    throw new Error(message);
  }

  console.log(
    '[eap] upload media files response',
    Array.isArray(parsed)
      ? parsed.map((record) => ({
          id: record.id,
          documentId: record.documentId,
          name: record.name,
        }))
      : parsed,
  );

  return Array.isArray(parsed) ? parsed : [];
}

async function syncPartitionMedia(documentId: string, formData: FormData) {
  const logoFile = getFileValue(formData, 'logo');
  const bannerFiles = getFileValues(formData, 'banners');

  if (!logoFile && bannerFiles.length === 0) {
    return;
  }

  const payload: Record<string, unknown> = {};

  if (logoFile) {
    const [uploadedLogo] = await uploadMediaFiles([logoFile]);

    if (uploadedLogo) {
      payload.logo = getMediaInput(uploadedLogo);
    }
  }

  if (bannerFiles.length > 0) {
    const uploadedBanners = await uploadMediaFiles(bannerFiles);
    payload.banners = uploadedBanners.map((banner) => getMediaInput(banner));
  }

  if (Object.keys(payload).length === 0) {
    return;
  }

  await eventPortalSdk.userPartitions.update(documentId, payload, {
    cache: 'no-store',
    revalidate: false,
  });
}

async function syncGroupMedia(documentId: string, formData: FormData) {
  const logoFile = getFileValue(formData, 'logo');

  if (!logoFile) {
    return;
  }

  console.log('[eap] sync group media start', {
    documentId,
    logoFile: {
      name: logoFile.name,
      size: logoFile.size,
      type: logoFile.type,
      lastModified: logoFile.lastModified,
    },
  });

  const [uploadedLogo] = await uploadMediaFiles([logoFile]);

  if (!uploadedLogo) {
    console.warn('[eap] sync group media aborted because upload returned no file', { documentId });
    return;
  }

  const logoPayload = {
    logo: getMediaInput(uploadedLogo),
  };

  console.log('[eap] sync group media update payload', {
    documentId,
    uploadedLogo: {
      id: uploadedLogo.id,
      documentId: uploadedLogo.documentId,
      name: uploadedLogo.name,
    },
    payload: logoPayload,
  });

  try {
    const response = await eventPortalSdk.userGroups.update(documentId, logoPayload, {
      cache: 'no-store',
      revalidate: false,
    });

    console.log('[eap] sync group media update response', {
      documentId,
      responseDocumentId: response.data?.documentId,
      responseLogo: response.data?.logo,
    });
  } catch (error) {
    if (error instanceof StrapiRequestError) {
      console.error('[eap] sync group media update failed', {
        documentId,
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        body: error.body,
      });
    } else {
      console.error('[eap] sync group media update failed', {
        documentId,
        error,
      });
    }

    throw error;
  }
}

function parseTemplateFieldValues(formData: FormData): TemplateFieldFormValue[] {
  const value = formData.get('formFieldsJson');

  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as TemplateFieldFormValue[]) : [];
  } catch {
    throw new Error('Invalid registration form fields payload.');
  }
}

function parseSlotPlanValues(formData: FormData): EventSlotPlanRow[] {
  const value = formData.get('slotPlanJson');

  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((row): row is EventSlotPlanRow => typeof row === 'object' && row !== null)
      .map((row) => ({
        id: String(row.id ?? ''),
        documentId: typeof row.documentId === 'string' && row.documentId.trim() ? row.documentId.trim() : undefined,
        date:
          typeof (row as { eventDate?: string }).eventDate === 'string'
            ? (row as { eventDate?: string }).eventDate!.trim()
            : typeof row.date === 'string'
              ? row.date.trim()
              : '',
        startTime: typeof row.startTime === 'string' ? row.startTime.trim() : '',
        endTime: typeof row.endTime === 'string' ? row.endTime.trim() : '',
        quota: Number(row.quota ?? 0),
        usedCount: Number(row.usedCount ?? 0),
        holdCount: Number(row.holdCount ?? 0),
        enabled: row.enabled !== false,
      }))
      .filter((row) => row.date && row.startTime && row.endTime && Number.isFinite(row.quota) && row.quota >= 0);
  } catch {
    throw new Error('Invalid event timeslot payload.');
  }
}

function normalizeSlotPlan(rows: EventSlotPlanRow[]) {
  const sorted = rows.slice().sort((left, right) => {
    const dateCompare = left.date.localeCompare(right.date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    const startCompare = left.startTime.localeCompare(right.startTime);

    if (startCompare !== 0) {
      return startCompare;
    }

    return left.endTime.localeCompare(right.endTime);
  });

  let currentDate = '';
  let sortOrder = 10;

  return sorted.map((row) => {
    if (row.date !== currentDate) {
      currentDate = row.date;
      sortOrder = 10;
    }

    const nextRow = {
      ...row,
      startTime: normalizeStrapiTimeValue(row.startTime),
      endTime: normalizeStrapiTimeValue(row.endTime),
      sortOrder,
      usedCount: Number.isFinite(row.usedCount) ? row.usedCount ?? 0 : 0,
      holdCount: Number.isFinite(row.holdCount) ? row.holdCount ?? 0 : 0,
    };

    sortOrder += 10;
    return nextRow;
  });
}

function buildEventSlotPayloads(formData: FormData): EventPortalEventSlotPayload[] {
  return normalizeSlotPlan(parseSlotPlanValues(formData)).map((slot) => ({
    documentId: slot.documentId,
    eventDate: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    enabled: slot.enabled !== false,
    quota: slot.quota,
    usedCount: slot.usedCount ?? 0,
    holdCount: slot.holdCount ?? 0,
    sortOrder: slot.sortOrder,
  }));
}

function toEventCodeSlug(value: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return normalized || 'event-copy';
}

async function buildDuplicateEventCode(sourceCode: string) {
  const baseCode = toEventCodeSlug(sourceCode);

  for (let suffix = 0; suffix < 100; suffix += 1) {
    const candidate = suffix === 0 ? `${baseCode}-copy` : `${baseCode}-copy-${suffix + 1}`;
    const response = await eventPortalSdk.events.findMany(
      {
        filters: {
          publicSlug: candidate,
        },
        limit: 1,
      },
      {
        cache: 'no-store',
        revalidate: false,
      },
    );

    if (response.data.length === 0) {
      return candidate;
    }
  }

  throw new Error('Unable to generate a unique event code for the duplicated event.');
}

async function getMandatoryFieldLibrary() {
  const response = await eventPortalSdk.mandatoryFields.findMany(
    {
      filters: { isActive: true },
      sort: ['sortOrder:asc', 'labelEn:asc'],
    },
    {
      cache: 'no-store',
      revalidate: false,
    },
  );

  return response.data.map((field) => ({
    fieldKey: field.key,
    labelEn: field.labelEn,
    labelZh: field.labelZh,
    fieldType: field.fieldType,
    required: Boolean(field.required),
    visibleInERP: true,
    visibleInECP: true,
    visibleInEAP: true,
    sortOrder: field.sortOrder ?? 0,
    isSystem: true,
    placeholderEn: field.placeholderEn,
    placeholderZh: field.placeholderZh,
    options: Array.isArray(field.optionsJson) ? field.optionsJson.filter((option): option is string => typeof option === 'string') : undefined,
  }));
}

async function getSelectedFields(formData: FormData) {
  const mandatoryFields = await getMandatoryFieldLibrary();
  return normalizeTemplateFields(parseTemplateFieldValues(formData), mandatoryFields);
}

async function getTemplateRecord(documentId?: string) {
  if (!documentId) {
    return undefined;
  }

  try {
    const response = await eventPortalSdk.eventTemplates.findOne(
      documentId,
      eventPortalQueries.templateDetail(),
      {
        cache: 'no-store',
        revalidate: false,
      },
    );

    return response.data;
  } catch {
    return undefined;
  }
}

function buildEventNoticeTemplateRelations(formData: FormData) {
  return {
    registrationNoticeTemplate: getOptionalValue(formData, 'registrationNoticeTemplateDocumentId'),
    announcementNoticeTemplate: getOptionalValue(formData, 'announcementNoticeTemplateDocumentId'),
    eventUpdateNoticeTemplate: getOptionalValue(formData, 'eventUpdateNoticeTemplateDocumentId'),
  };
}

function getTemplatePartitionDocumentIds(templateRecord: Record<string, any> | undefined) {
  if (!templateRecord) {
    return [];
  }

  const partitions = Array.isArray(templateRecord.userPartitions)
    ? templateRecord.userPartitions
    : templateRecord.userPartition
      ? [templateRecord.userPartition]
      : [];

  return partitions
    .map((partition) => (typeof partition?.documentId === 'string' ? partition.documentId : ''))
    .filter(Boolean);
}

function validateTemplatePartitionAssignment(templateRecord: Record<string, any> | undefined, partitionDocumentId?: string) {
  if (!templateRecord || !partitionDocumentId) {
    return;
  }

  const assignedPartitionDocumentIds = getTemplatePartitionDocumentIds(templateRecord);

  if (!assignedPartitionDocumentIds.includes(partitionDocumentId)) {
    throw new Error('Selected partition is not assigned to the chosen template.');
  }
}

function getListPath(kind: EapRecordKind) {
  return eapRecordConfig[kind].listPath;
}

async function canWriteToStrapi() {
  return Boolean(await getServerStrapiRequestToken(true));
}

function getErrorMessage(error: unknown) {
  if (error instanceof StrapiRequestError) {
    const body = error.body as
      | {
          error?: {
            message?: string;
            details?: unknown;
          };
        }
      | undefined;

    return body?.error?.message || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return undefined;
}

function redirectWithNotice(path: string, code: string, title?: string, message?: string) {
  redirect(`${path}${getNoticeQueryString(code, title, message)}`);
}

async function postManagementEventAction(documentId: string, action: 'publish' | 'unpublish' | 'disable') {
  const token = await getServerStrapiRequestToken();
  const response = await fetch(`${getStrapiBaseUrl()}/api/portal/management/events/${documentId}/${action}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  const parsed = (await response.json().catch(() => undefined)) as { error?: { message?: string } } | undefined;

  if (!response.ok) {
    throw new Error(parsed?.error?.message || `Failed to ${action} event.`);
  }
}

async function syncGroupPortalUsers(groupDocumentId: string, formData: FormData) {
  const selectedUserDocumentIds = new Set(getRelationValues(formData, 'portalUserDocumentIds'));
  const response = await eventPortalSdk.users.findMany(
    {
      populate: {
        userGroups: true,
      },
      sort: ['username:asc', 'email:asc'],
    },
    {
      cache: 'no-store',
      revalidate: false,
    },
  );

  const clientUsers = response.data.filter((user) => (user.portalRole ?? 'CLIENT_HR') === 'CLIENT_HR');

  for (const user of clientUsers) {
    const currentGroupDocumentIds = Array.isArray(user.userGroups)
      ? user.userGroups.map((group) => group.documentId).filter(Boolean)
      : [];
    const isLinked = currentGroupDocumentIds.includes(groupDocumentId);
    const shouldBeLinked = selectedUserDocumentIds.has(user.documentId);

    if (isLinked === shouldBeLinked) {
      continue;
    }

    await eventPortalSdk.users.update(
      user.documentId,
      {
        userGroups: shouldBeLinked
          ? Array.from(new Set([...currentGroupDocumentIds, groupDocumentId]))
          : currentGroupDocumentIds.filter((value) => value !== groupDocumentId),
      },
      {
        cache: 'no-store',
        revalidate: false,
      },
    );
  }
}

async function tryCreateRecord(kind: EapRecordKind, formData: FormData) {
  switch (kind) {
    case 'template': {
      return eventPortalSdk.eventTemplates.create({
        name: getValue(formData, 'name'),
        description: getOptionalValue(formData, 'description'),
        eventTemplateStatus: 'ACTIVE',
        userPartitions: getRelationValues(formData, 'partitionDocumentIds'),
        formFields: await getSelectedFields(formData),
      });
    }
    case 'noticeTemplate': {
      return eventPortalSdk.noticeTemplates.create({
        name: getValue(formData, 'name'),
        description: getOptionalValue(formData, 'description'),
        channel: getValue(formData, 'channel') as 'EMAIL' | 'SMS',
        subject: getOptionalValue(formData, 'subject'),
        plainTextBody: getValue(formData, 'plainTextBody'),
        htmlBody: getOptionalValue(formData, 'htmlBody'),
        active: getValue(formData, 'active') !== 'false',
        sortOrder: getNumberValue(formData, 'sortOrder'),
      });
    }
    case 'event': {
      const appBaseUrl = await getAppBaseUrl();
      const eventStatus = getValue(formData, 'status') as EventStatus;
      const showInRegistrationPeriod = getOptionalBooleanValue(formData, 'showInRegistrationPeriod');
      const showInEventPeriod = getOptionalBooleanValue(formData, 'showInEventPeriod');
      const showInExpired = getOptionalBooleanValue(formData, 'showInExpired');
      const templateRecord = await getTemplateRecord(getOptionalValue(formData, 'templateDocumentId'));
      const partitionDocumentId = getOptionalValue(formData, 'partitionDocumentId');
      const eventSlots = buildEventSlotPayloads(formData);
      const noticeTemplates = buildEventNoticeTemplateRelations(formData);
      validateTemplatePartitionAssignment(templateRecord, partitionDocumentId);
      const payload = {
        companyName: getValue(formData, 'companyName'),
        location: getValue(formData, 'location'),
        eventName: getValue(formData, 'eventName'),
        eventDescription: getOptionalValue(formData, 'description'),
        eventNotes: getOptionalValue(formData, 'notes'),
        eventStatus,
        eventStartDate: getValue(formData, 'eventStartDate'),
        eventEndDate: getValue(formData, 'eventEndDate'),
        dayStartTime: normalizeStrapiTimeValue(getValue(formData, 'dayStartTime')),
        dayEndTime: normalizeStrapiTimeValue(getValue(formData, 'dayEndTime')),
        registrationStartDate: getValue(formData, 'registrationStartDate'),
        registrationEndDate: getValue(formData, 'registrationEndDate'),
        reminderOffsetDays: getNumberValue(formData, 'reminderOffsetDays'),
        publicSlug: getValue(formData, 'eventCode'),
        publicBaseUrl: appBaseUrl,
        publishedToPortals: getPublishedToPortalsForStatus(eventStatus),
        userPartition: partitionDocumentId,
        template: templateRecord?.documentId,
        ...noticeTemplates,
        eventSlots,
        ...(showInRegistrationPeriod !== undefined ? { showInRegistrationPeriod } : {}),
        ...(showInEventPeriod !== undefined ? { showInEventPeriod } : {}),
        ...(showInExpired !== undefined ? { showInExpired } : {}),
      };

      console.log('[eap] create event payload', payload);

      return eventPortalSdk.events.create(payload);
    }
    case 'appointment':
      return eventPortalSdk.appointments.create({
        bookingReference: getValue(formData, 'bookingReference'),
        participantName: getValue(formData, 'participantName'),
        staffNumber: getOptionalValue(formData, 'staffNumber'),
        medicalCardNumber: getOptionalValue(formData, 'medicalCardNumber'),
        hkidPrefix: getOptionalValue(formData, 'hkidPrefix'),
        registeredEmail: getOptionalValue(formData, 'registeredEmail'),
        mobileNumber: getOptionalValue(formData, 'mobileNumber'),
        communicationPreference: getValue(formData, 'communicationPreference') as CommunicationPreference,
        appointmentStatus: getValue(formData, 'status') as AppointmentStatus,
        appointmentDate: getValue(formData, 'appointmentDate'),
        appointmentStartTime: getValue(formData, 'appointmentStartTime'),
        appointmentEndTime: getValue(formData, 'appointmentEndTime'),
        quotaSnapshot: getNumberValue(formData, 'quota'),
        portalSource: getValue(formData, 'portalSource') as 'EAP' | 'ECP' | 'ERP',
        event: getOptionalValue(formData, 'eventDocumentId'),
      });
    case 'partition':
      return eventPortalSdk.userPartitions.create({
        code: getValue(formData, 'code'),
        description: getValue(formData, 'description'),
        slug: getValue(formData, 'slug'),
        userPartitionStatus: getValue(formData, 'status') as GroupStatus,
        remarks: getOptionalValue(formData, 'remarks'),
        userGroup: getOptionalValue(formData, 'userGroupDocumentId'),
      });
    case 'group':
      {
        const payload = {
          code: getValue(formData, 'code'),
          description: getValue(formData, 'description'),
          companyName: getOptionalValue(formData, 'companyName'),
          remarks: getOptionalValue(formData, 'remarks'),
          userGroupStatus: getValue(formData, 'status') as GroupStatus,
          partitions: getRelationValues(formData, 'partitionDocumentIds'),
        };

        console.log('[eap] create group payload', payload);

        return eventPortalSdk.userGroups.create(payload);
      }
    case 'profile':
      return eventPortalSdk.users.create({
        email: getValue(formData, 'email'),
        username: getValue(formData, 'username') || getValue(formData, 'email'),
        password: getOptionalValue(formData, 'password'),
        confirmed: getValue(formData, 'confirmed') !== 'false',
        blocked: getValue(formData, 'status') === 'DISABLED',
        portalRole: getValue(formData, 'portalRole') as PortalRole,
        userGroups: getUserGroupRelationValues(formData),
      });
    case 'portalDocument': {
      const file = getFileValue(formData, 'file');

      if (!file) {
        throw new Error('Document file is required.');
      }

      const [uploadedFile] = await uploadMediaFiles([file]);

      if (!uploadedFile) {
        throw new Error('Failed to upload document file.');
      }

      return eventPortalSdk.portalDocuments.create({
        titleEn: getValue(formData, 'titleEn'),
        titleZh: getOptionalValue(formData, 'titleZh'),
        descriptionEn: getOptionalValue(formData, 'descriptionEn'),
        descriptionZh: getOptionalValue(formData, 'descriptionZh'),
        portalTargets: getRelationValues(formData, 'portalTargets') as Array<'ECP' | 'ERP'>,
        sortOrder: getNumberValue(formData, 'sortOrder'),
        active: getValue(formData, 'active') !== 'false',
        file: getMediaInput(uploadedFile),
        userPartition: getOptionalValue(formData, 'partitionDocumentId'),
      });
    }
    case 'contactInfo':
      return eventPortalSdk.contactInfos.create({
        titleEn: getValue(formData, 'titleEn'),
        titleZh: getOptionalValue(formData, 'titleZh'),
        descriptionEn: getOptionalValue(formData, 'descriptionEn'),
        descriptionZh: getOptionalValue(formData, 'descriptionZh'),
        email: getOptionalValue(formData, 'email'),
        phone: getOptionalValue(formData, 'phone'),
        addressEn: getOptionalValue(formData, 'addressEn'),
        addressZh: getOptionalValue(formData, 'addressZh'),
        portalTargets: getRelationValues(formData, 'portalTargets') as Array<'ECP' | 'ERP'>,
        sortOrder: getNumberValue(formData, 'sortOrder'),
        active: getValue(formData, 'active') !== 'false',
        userPartition: getOptionalValue(formData, 'partitionDocumentId'),
      });
  }
}

async function tryUpdateRecord(kind: EapRecordKind, documentId: string, formData: FormData) {
  switch (kind) {
    case 'template': {
      return eventPortalSdk.eventTemplates.update(documentId, {
        name: getValue(formData, 'name'),
        description: getOptionalValue(formData, 'description'),
        userPartitions: getRelationValues(formData, 'partitionDocumentIds'),
        formFields: await getSelectedFields(formData),
      });
    }
    case 'noticeTemplate': {
      return eventPortalSdk.noticeTemplates.update(documentId, {
        name: getValue(formData, 'name'),
        description: getOptionalValue(formData, 'description'),
        channel: getValue(formData, 'channel') as 'EMAIL' | 'SMS',
        subject: getOptionalValue(formData, 'subject'),
        plainTextBody: getValue(formData, 'plainTextBody'),
        htmlBody: getOptionalValue(formData, 'htmlBody'),
        active: getValue(formData, 'active') !== 'false',
        sortOrder: getNumberValue(formData, 'sortOrder'),
      });
    }
    case 'event': {
      const appBaseUrl = await getAppBaseUrl();
      const eventStatus = getValue(formData, 'status') as EventStatus;
      const showInRegistrationPeriod = getOptionalBooleanValue(formData, 'showInRegistrationPeriod');
      const showInEventPeriod = getOptionalBooleanValue(formData, 'showInEventPeriod');
      const showInExpired = getOptionalBooleanValue(formData, 'showInExpired');
      const noticeTemplates = buildEventNoticeTemplateRelations(formData);
      const templateRecord = await getTemplateRecord(getOptionalValue(formData, 'templateDocumentId'));
      const partitionDocumentId = getOptionalValue(formData, 'partitionDocumentId');
      validateTemplatePartitionAssignment(templateRecord, partitionDocumentId);
      const payload = {
        companyName: getValue(formData, 'companyName'),
        location: getValue(formData, 'location'),
        eventName: getValue(formData, 'eventName'),
        eventDescription: getOptionalValue(formData, 'description'),
        eventNotes: getOptionalValue(formData, 'notes'),
        eventStatus,
        eventStartDate: getValue(formData, 'eventStartDate'),
        eventEndDate: getValue(formData, 'eventEndDate'),
        dayStartTime: normalizeStrapiTimeValue(getValue(formData, 'dayStartTime')),
        dayEndTime: normalizeStrapiTimeValue(getValue(formData, 'dayEndTime')),
        registrationStartDate: getValue(formData, 'registrationStartDate'),
        registrationEndDate: getValue(formData, 'registrationEndDate'),
        reminderOffsetDays: getNumberValue(formData, 'reminderOffsetDays'),
        publicSlug: getValue(formData, 'eventCode'),
        publicBaseUrl: appBaseUrl,
        publishedToPortals: getPublishedToPortalsForStatus(eventStatus),
        userPartition: partitionDocumentId,
        template: templateRecord?.documentId,
        ...noticeTemplates,
        eventSlots: buildEventSlotPayloads(formData),
        ...(showInRegistrationPeriod !== undefined ? { showInRegistrationPeriod } : {}),
        ...(showInEventPeriod !== undefined ? { showInEventPeriod } : {}),
        ...(showInExpired !== undefined ? { showInExpired } : {}),
      };

      console.log('[eap] update event payload', { documentId, ...payload });

      return eventPortalSdk.events.update(documentId, payload);
    }
    case 'appointment':
      return eventPortalSdk.appointments.update(documentId, {
        bookingReference: getValue(formData, 'bookingReference'),
        participantName: getValue(formData, 'participantName'),
        staffNumber: getOptionalValue(formData, 'staffNumber'),
        medicalCardNumber: getOptionalValue(formData, 'medicalCardNumber'),
        hkidPrefix: getOptionalValue(formData, 'hkidPrefix'),
        registeredEmail: getOptionalValue(formData, 'registeredEmail'),
        mobileNumber: getOptionalValue(formData, 'mobileNumber'),
        communicationPreference: getValue(formData, 'communicationPreference') as CommunicationPreference,
        appointmentStatus: getValue(formData, 'status') as AppointmentStatus,
        appointmentDate: getValue(formData, 'appointmentDate'),
        appointmentStartTime: getValue(formData, 'appointmentStartTime'),
        appointmentEndTime: getValue(formData, 'appointmentEndTime'),
        quotaSnapshot: getNumberValue(formData, 'quota'),
        portalSource: getValue(formData, 'portalSource') as 'EAP' | 'ECP' | 'ERP',
        event: getOptionalValue(formData, 'eventDocumentId'),
      });
    case 'partition':
      return eventPortalSdk.userPartitions.update(documentId, {
        code: getValue(formData, 'code'),
        description: getValue(formData, 'description'),
        slug: getValue(formData, 'slug'),
        userPartitionStatus: getValue(formData, 'status') as GroupStatus,
        remarks: getOptionalValue(formData, 'remarks'),
        userGroup: getOptionalValue(formData, 'userGroupDocumentId'),
      });
    case 'group':
      {
        const payload = {
          code: getValue(formData, 'code'),
          description: getValue(formData, 'description'),
          companyName: getOptionalValue(formData, 'companyName'),
          remarks: getOptionalValue(formData, 'remarks'),
          userGroupStatus: getValue(formData, 'status') as GroupStatus,
          partitions: getRelationValues(formData, 'partitionDocumentIds'),
        };

        console.log('[eap] update group payload', { documentId, ...payload });

        return eventPortalSdk.userGroups.update(documentId, payload);
      }
    case 'profile':
      return eventPortalSdk.users.update(documentId, {
        email: getValue(formData, 'email'),
        username: getValue(formData, 'username') || getValue(formData, 'email'),
        password: getOptionalValue(formData, 'password'),
        confirmed: getValue(formData, 'confirmed') !== 'false',
        blocked: getValue(formData, 'status') === 'DISABLED',
        portalRole: getValue(formData, 'portalRole') as PortalRole,
        userGroups: getUserGroupRelationValues(formData),
      });
    case 'portalDocument': {
      const file = getFileValue(formData, 'file');
      const uploadedFile = file ? (await uploadMediaFiles([file]))[0] : undefined;

      return eventPortalSdk.portalDocuments.update(documentId, {
        titleEn: getValue(formData, 'titleEn'),
        titleZh: getOptionalValue(formData, 'titleZh'),
        descriptionEn: getOptionalValue(formData, 'descriptionEn'),
        descriptionZh: getOptionalValue(formData, 'descriptionZh'),
        portalTargets: getRelationValues(formData, 'portalTargets') as Array<'ECP' | 'ERP'>,
        sortOrder: getNumberValue(formData, 'sortOrder'),
        active: getValue(formData, 'active') !== 'false',
        file: uploadedFile ? getMediaInput(uploadedFile) : undefined,
        userPartition: getOptionalValue(formData, 'partitionDocumentId'),
      });
    }
    case 'contactInfo':
      return eventPortalSdk.contactInfos.update(documentId, {
        titleEn: getValue(formData, 'titleEn'),
        titleZh: getOptionalValue(formData, 'titleZh'),
        descriptionEn: getOptionalValue(formData, 'descriptionEn'),
        descriptionZh: getOptionalValue(formData, 'descriptionZh'),
        email: getOptionalValue(formData, 'email'),
        phone: getOptionalValue(formData, 'phone'),
        addressEn: getOptionalValue(formData, 'addressEn'),
        addressZh: getOptionalValue(formData, 'addressZh'),
        portalTargets: getRelationValues(formData, 'portalTargets') as Array<'ECP' | 'ERP'>,
        sortOrder: getNumberValue(formData, 'sortOrder'),
        active: getValue(formData, 'active') !== 'false',
        userPartition: getOptionalValue(formData, 'partitionDocumentId'),
      });
  }
}

export async function createRecordAction(kind: EapRecordKind, formData: FormData) {
  const createPath = getRecordCreatePath(kind);
  let createdDocumentId: string | undefined;
  const draftKind = getCreateDraftKind(kind);

  if (!(await canWriteToStrapi())) {
    if (draftKind) {
      await persistCreateDraft(draftKind, buildCreateDraft(draftKind, formData));
    }
    redirectWithNotice(createPath, 'create-failed');
  }

  try {
    const response = await tryCreateRecord(kind, formData);
    const documentId = response?.data?.documentId;
    createdDocumentId = documentId;

    if (!documentId) {
      throw new Error('Strapi did not return a document ID for the created record.');
    }

    if (kind === 'group') {
      await syncGroupPortalUsers(documentId, formData);
      await syncGroupMedia(documentId, formData);
    }

    if (kind === 'partition') {
      await syncPartitionMedia(documentId, formData);
    }

    if (draftKind) {
      await clearCreateDraft(draftKind);
    }

    revalidatePath(getListPath(kind));
    redirectWithNotice(getRecordDetailPath(kind, documentId), 'created');
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (kind === 'partition' && createdDocumentId) {
      redirectWithNotice(
        getRecordDetailPath(kind, createdDocumentId),
        'update-failed',
        'Partition created, but media upload failed',
        getErrorMessage(error),
      );
    }

    if (kind === 'group' && createdDocumentId) {
      redirectWithNotice(
        getRecordDetailPath(kind, createdDocumentId),
        'update-failed',
        'Group created, but logo upload failed',
        getErrorMessage(error),
      );
    }

    if (draftKind) {
      await persistCreateDraft(draftKind, buildCreateDraft(draftKind, formData));
    }

    redirectWithNotice(createPath, 'create-failed', undefined, getErrorMessage(error));
  }
}

export async function updateRecordAction(kind: EapRecordKind, documentId: string, formData: FormData) {
  const detailPath = getRecordDetailPath(kind, documentId);

  if (!(await canWriteToStrapi())) {
    redirectWithNotice(detailPath, 'update-failed');
  }

  try {
    await tryUpdateRecord(kind, documentId, formData);

    if (kind === 'group') {
      await syncGroupPortalUsers(documentId, formData);
      await syncGroupMedia(documentId, formData);
    }

    if (kind === 'partition') {
      await syncPartitionMedia(documentId, formData);
    }

    revalidatePath(getListPath(kind));
    revalidatePath(detailPath);
    redirectWithNotice(detailPath, 'updated');
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirectWithNotice(detailPath, 'update-failed', undefined, getErrorMessage(error));
  }
}

export async function duplicateEventAction(sourceDocumentId: string) {
  const listPath = getListPath('event');

  if (!(await canWriteToStrapi())) {
    redirectWithNotice(listPath, 'duplicate-failed');
  }

  try {
    const response = await eventPortalSdk.events.findOne(
      sourceDocumentId,
      {
        populate: {
          userPartition: true,
          template: true,
          slots: true,
          registrationNoticeTemplate: true,
          announcementNoticeTemplate: true,
          eventUpdateNoticeTemplate: true,
        },
      },
      {
        cache: 'no-store',
        revalidate: false,
      },
    );
    const source = response.data;
    const duplicateEventCode = await buildDuplicateEventCode(source.publicSlug ?? source.documentId);
    const duplicateResponse = await eventPortalSdk.events.create(
      {
        companyName: source.companyName,
        companyNameZh: source.companyNameZh,
        location: source.location,
        locationZh: source.locationZh,
        eventName: `${source.eventName} (Copy)`,
        eventNameZh: source.eventNameZh,
        eventDescription: source.eventDescription,
        eventDescriptionZh: source.eventDescriptionZh,
        eventNotes: source.eventNotes,
        eventNotesZh: source.eventNotesZh,
        eventStatus: 'DRAFT',
        eventStartDate: source.eventStartDate,
        eventEndDate: source.eventEndDate,
        dayStartTime: source.dayStartTime,
        dayEndTime: source.dayEndTime,
        registrationStartDate: source.registrationStartDate,
        registrationEndDate: source.registrationEndDate,
        reminderOffsetDays: source.reminderOffsetDays ?? 2,
        publicSlug: duplicateEventCode,
        publishedToPortals: false,
        publicBaseUrl: source.publicBaseUrl,
        registrationNoticeTemplate: getRelationDocumentId(source.registrationNoticeTemplate),
        announcementNoticeTemplate: getRelationDocumentId(source.announcementNoticeTemplate),
        eventUpdateNoticeTemplate: getRelationDocumentId(source.eventUpdateNoticeTemplate),
        userPartition: getRelationDocumentId(source.userPartition),
        template: getRelationDocumentId(source.template),
        eventSlots: (Array.isArray(source.slots) ? source.slots : []).reduce<EventPortalEventSlotPayload[]>((result, slot) => {
          if (isDuplicatedEventSlot(slot)) {
            result.push({
              eventDate: slot.eventDate,
              startTime: normalizeStrapiTimeValue(slot.startTime),
              endTime: normalizeStrapiTimeValue(slot.endTime),
              enabled: slot.enabled !== false,
              quota: slot.quota,
              usedCount: 0,
              holdCount: 0,
              sortOrder: slot.sortOrder ?? 0,
            });
          }

          return result;
        }, []),
      },
      {
        cache: 'no-store',
        revalidate: false,
      },
    );
    const duplicatedDocumentId = duplicateResponse.data.documentId;

    if (!duplicatedDocumentId) {
      throw new Error('Strapi did not return a document ID for the duplicated event.');
    }

    revalidatePath(listPath);
    revalidatePath(getRecordDetailPath('event', duplicatedDocumentId));
    redirectWithNotice(getRecordDetailPath('event', duplicatedDocumentId), 'duplicated');
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirectWithNotice(listPath, 'duplicate-failed', undefined, getErrorMessage(error));
  }
}

export async function changeEventPublicationAction(documentId: string, action: 'publish' | 'unpublish' | 'disable') {
  const detailPath = getRecordDetailPath('event', documentId);

  if (!(await canWriteToStrapi())) {
    redirectWithNotice(detailPath, 'update-failed');
  }

  try {
    await postManagementEventAction(documentId, action);
    revalidatePath(getListPath('event'));
    revalidatePath(detailPath);
    redirectWithNotice(detailPath, action === 'publish' ? 'published' : action === 'unpublish' ? 'unpublished' : 'disabled');
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const code = action === 'publish' ? 'publish-failed' : action === 'unpublish' ? 'unpublish-failed' : 'disable-failed';
    redirectWithNotice(detailPath, code, undefined, getErrorMessage(error));
  }
}

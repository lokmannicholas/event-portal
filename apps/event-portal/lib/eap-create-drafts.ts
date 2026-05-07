import { cookies } from 'next/headers';

export type EapCreateDraftKind = 'event' | 'template';

const COOKIE_NAME_BY_KIND: Record<EapCreateDraftKind, string> = {
  event: 'eap_create_draft_event',
  template: 'eap_create_draft_template',
};

const COOKIE_PATH_BY_KIND: Record<EapCreateDraftKind, string> = {
  event: '/events/new',
  template: '/templates/new',
};

const COOKIE_MAX_AGE_SECONDS = 10 * 60;

export type EventCreateDraft = {
  eventName?: string;
  eventCode?: string;
  companyName?: string;
  location?: string;
  partitionDocumentId?: string;
  templateDocumentId?: string;
  status?: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  dayStartTime?: string;
  dayEndTime?: string;
  showInRegistrationPeriod?: string;
  showInEventPeriod?: string;
  showInExpired?: string;
  reminderOffsetDays?: string;
  description?: string;
  notes?: string;
  smsRegistrationNoticeTemplateDocumentId?: string;
  smsAnnouncementNoticeTemplateDocumentId?: string;
  smsEventUpdateNoticeTemplateDocumentId?: string;
  emailRegistrationNoticeTemplateDocumentId?: string;
  emailAnnouncementNoticeTemplateDocumentId?: string;
  emailEventUpdateNoticeTemplateDocumentId?: string;
  slotPlanJson?: string;
};

export type TemplateCreateDraft = {
  name?: string;
  description?: string;
  partitionDocumentIds?: string[];
  formFieldsJson?: string;
};

async function getCookieStore() {
  return cookies();
}

export async function readCreateDraft<T>(kind: EapCreateDraftKind): Promise<T | undefined> {
  const cookieStore = await getCookieStore();
  const value = cookieStore.get(COOKIE_NAME_BY_KIND[kind])?.value;

  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

export async function persistCreateDraft(kind: EapCreateDraftKind, value: object) {
  const cookieStore = await getCookieStore();
  cookieStore.set(COOKIE_NAME_BY_KIND[kind], JSON.stringify(value), {
    httpOnly: true,
    sameSite: 'lax',
    path: COOKIE_PATH_BY_KIND[kind],
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearCreateDraft(kind: EapCreateDraftKind) {
  const cookieStore = await getCookieStore();
  cookieStore.set(COOKIE_NAME_BY_KIND[kind], '', {
    httpOnly: true,
    sameSite: 'lax',
    path: COOKIE_PATH_BY_KIND[kind],
    maxAge: 0,
  });
}

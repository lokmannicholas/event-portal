import type { EformListItemDTO, EventListItemDTO, FormFieldConfigDTO } from '@event-portal/contracts';
import {
  PORTAL_LANGUAGE_QUERY_PARAM,
  getPortalLanguageFromSearchParams,
  resolvePortalLanguage,
  type PortalLanguage,
  withPortalLanguage,
} from './portal-language';

export type ErpLanguage = PortalLanguage;

export const ERP_LANGUAGE_QUERY_PARAM = PORTAL_LANGUAGE_QUERY_PARAM;
export const resolveErpLanguage = resolvePortalLanguage;
export const getErpLanguageFromSearchParams = getPortalLanguageFromSearchParams;

export function isTraditionalChinese(language: ErpLanguage) {
  return language === 'zh-Hant';
}

export function getLocalizedText(language: ErpLanguage, english?: string | null, traditionalChinese?: string | null) {
  const englishText = english?.trim();
  const chineseText = traditionalChinese?.trim();

  if (language === 'zh-Hant') {
    return chineseText || englishText || '';
  }

  return englishText || chineseText || '';
}

export function withErpLanguage(href: string, language: ErpLanguage) {
  return withPortalLanguage(href, language);
}

export function getLocalizedEventName(
  event: Pick<EventListItemDTO, 'eventName' | 'eventNameZh'>,
  language: ErpLanguage,
) {
  return getLocalizedText(language, event.eventName, event.eventNameZh);
}

export function getLocalizedCompanyName(
  event: Pick<EventListItemDTO, 'companyName' | 'companyNameZh'>,
  language: ErpLanguage,
) {
  return getLocalizedText(language, event.companyName, event.companyNameZh);
}

export function getLocalizedLocation(
  event: Pick<EventListItemDTO, 'location' | 'locationZh'>,
  language: ErpLanguage,
) {
  return getLocalizedText(language, event.location, event.locationZh);
}

export function getLocalizedDescription(
  event: Pick<EventListItemDTO, 'description' | 'descriptionZh'>,
  language: ErpLanguage,
) {
  return getLocalizedText(language, event.description, event.descriptionZh);
}

export function getLocalizedNotes(
  event: Pick<EventListItemDTO, 'notes' | 'notesZh'>,
  language: ErpLanguage,
) {
  return getLocalizedText(language, event.notes, event.notesZh);
}

export function getLocalizedEformName(
  eform: Pick<EformListItemDTO, 'eformName' | 'eformNameZh'>,
  language: ErpLanguage,
) {
  return getLocalizedText(language, eform.eformName, eform.eformNameZh);
}

export function getLocalizedEformDescription(
  eform: Pick<EformListItemDTO, 'description' | 'descriptionZh'>,
  language: ErpLanguage,
) {
  return getLocalizedText(language, eform.description, eform.descriptionZh);
}

export function getLocalizedEformNotes(
  eform: Pick<EformListItemDTO, 'notes' | 'notesZh'>,
  language: ErpLanguage,
) {
  return getLocalizedText(language, eform.notes, eform.notesZh);
}

export function getLocalizedFieldLabel(
  field: Pick<FormFieldConfigDTO, 'labelEn' | 'labelZh'>,
  language: ErpLanguage,
) {
  return getLocalizedText(language, field.labelEn, field.labelZh);
}

export function getLocalizedFieldPlaceholder(
  field: Pick<FormFieldConfigDTO, 'placeholderEn' | 'placeholderZh'>,
  language: ErpLanguage,
) {
  return getLocalizedText(language, field.placeholderEn, field.placeholderZh);
}

export function getLocalizedEventStatus(status: string, language: ErpLanguage) {
  if (language !== 'zh-Hant') {
    return status;
  }

  const translations: Record<string, string> = {
    DRAFT: '草稿',
    RELEASED: '已發佈',
    DISABLED: '已停用',
    CLOSED: '已關閉',
    CONFIRMED: '已確認',
    CANCELLED: '已取消',
    EXPIRED: '已過期',
  };

  return translations[status] ?? status;
}

export type PortalLanguage = 'en' | 'zh-Hant';

export const PORTAL_LANGUAGE_QUERY_PARAM = 'lang';
export const PORTAL_LANGUAGE_COOKIE = 'portal_lang';

type SearchParamValue = string | string[] | undefined;

function firstSearchParamValue(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function parsePortalLanguage(value?: string | null): PortalLanguage | null {
  const normalized = value?.trim().toLowerCase();

  if (normalized === 'en') {
    return 'en';
  }

  if (normalized === 'zh' || normalized === 'zh-hant' || normalized === 'zh-hk' || normalized === 'zh-tw') {
    return 'zh-Hant';
  }

  return null;
}

export function resolvePortalLanguage(value?: string | null): PortalLanguage {
  return parsePortalLanguage(value) ?? 'zh-Hant';
}

export function getPortalLanguageFromSearchParams(searchParams?: Record<string, SearchParamValue>) {
  return resolvePortalLanguage(firstSearchParamValue(searchParams?.[PORTAL_LANGUAGE_QUERY_PARAM]));
}

export function withPortalLanguage(href: string, language: PortalLanguage) {
  const url = new URL(href, 'http://portal.local');
  url.searchParams.set(PORTAL_LANGUAGE_QUERY_PARAM, language);
  return `${url.pathname}${url.search}${url.hash}`;
}

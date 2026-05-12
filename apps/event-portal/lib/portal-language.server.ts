import { cookies } from 'next/headers';
import { PORTAL_LANGUAGE_COOKIE, parsePortalLanguage, type PortalLanguage } from './portal-language';

export async function getPortalLanguageFromCookies(defaultLanguage: PortalLanguage = 'en') {
  const cookieStore = await cookies();
  return parsePortalLanguage(cookieStore.get(PORTAL_LANGUAGE_COOKIE)?.value) ?? defaultLanguage;
}

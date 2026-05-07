import type { NavItem } from '@event-portal/ui';
import { type PortalLanguage, withPortalLanguage } from './portal-language';

export function buildEcpNav(groupCode: string | undefined, language: PortalLanguage): NavItem[] {
  if (!groupCode) {
    return [];
  }

  const base = `/ecp/${groupCode}`;
  const isZh = language === 'zh-Hant';

  return [
    { href: withPortalLanguage(base, language), label: isZh ? '主頁' : 'Dashboard' },
    { href: withPortalLanguage(`${base}/events`, language), label: isZh ? '活動' : 'Event Appointment Master' },
    { href: withPortalLanguage(`${base}/documents`, language), label: isZh ? '文件' : 'Useful Information' },
    { href: withPortalLanguage(`${base}/contact`, language), label: isZh ? '聯絡我們' : 'Contact Us' },
  ];
}

import type { NavItem } from '@event-portal/ui';
import { type ErpLanguage, withErpLanguage } from './erp-language';

export function buildErpNav(partitionCode: string | undefined, language: ErpLanguage): NavItem[] {
  if (!partitionCode) {
    return [];
  }

  const base = `/p/${partitionCode}`;

  return [
    { href: withErpLanguage(base, language), label: language === 'zh-Hant' ? '主頁' : 'Home' },
    { href: withErpLanguage(`${base}/enquiry`, language), label: language === 'zh-Hant' ? '預約查詢' : 'Appointment Enquiry' },
    { href: withErpLanguage(`${base}/documents`, language), label: language === 'zh-Hant' ? '實用資訊' : 'Useful Information' },
    { href: withErpLanguage(`${base}/contact`, language), label: language === 'zh-Hant' ? '聯絡我們' : 'Contact Us' },
  ];
}

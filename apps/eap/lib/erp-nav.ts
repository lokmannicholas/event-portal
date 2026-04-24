import type { NavItem } from '@flu-vax/ui';

export function buildErpNav(partitionCode?: string): NavItem[] {
  if (!partitionCode) {
    return [];
  }

  const base = `/p/${partitionCode}`;

  return [
    { href: base, label: 'Home / 主頁' },
    { href: `${base}/enquiry`, label: 'Appointment Enquiry / 查詢' },
    { href: `${base}/documents`, label: 'Useful Information / 文件' },
    { href: `${base}/contact`, label: 'Contact Us / 聯絡我們' },
  ];
}

import type { NavItem } from '@flu-vax/ui';

export function buildEcpNav(groupCode?: string): NavItem[] {
  if (!groupCode) {
    return [];
  }

  const base = `/ecp/${groupCode}`;

  return [
    { href: base, label: 'Dashboard / 主頁' },
    { href: `${base}/events`, label: 'Event Appointment Master / 活動' },
    { href: `${base}/documents`, label: 'Useful Information / 文件' },
    { href: `${base}/contact`, label: 'Contact Us / 聯絡我們' },
  ];
}

import type { NavItem } from '@flu-vax/ui';

export const eapNav: NavItem[] = [
  { href: '/', label: 'Dashboard / 主頁' },
  {
    label: 'Template Management / 模板管理',
    items: [
      { href: '/templates', label: 'Template Master / 模板' },
      { href: '/notice-templates', label: 'Notice Templates / 通知模板' },
    ],
  },
  {
    label: 'Event Management / 活動管理',
    items: [
      { href: '/events', label: 'Registration Master / 活動' },
      { href: '/appointments', label: 'Appointment Master / 預約' },
    ],
  },
  {
    label: 'User Management / 用戶管理',
    items: [
      { href: '/partitions', label: 'User Partition / 分區' },
      { href: '/groups', label: 'User Group / 用戶群組' },
      { href: '/profiles', label: 'Users / 用戶' },
      { href: '/notices', label: 'Notice History / 通知記錄' },
    ],
  },
  {
    label: 'Others / 其他',
    items: [
      { href: '/content', label: 'Useful Information / 文件' },
      { href: '/contact', label: 'Contact Us / 聯絡我們' },
    ],
  },
];

import type { NavItem } from '@event-portal/ui';
import { type PortalLanguage, withPortalLanguage } from './portal-language';

export function buildEapNav(language: PortalLanguage): NavItem[] {
  const isZh = language === 'zh-Hant';

  return [
    { href: withPortalLanguage('/', language), label: isZh ? '主頁' : 'Dashboard' },
    {
      label: isZh ? '模板管理' : 'Template Management',
      items: [
        { href: withPortalLanguage('/templates', language), label: isZh ? '模板' : 'Template Master' },
        { href: withPortalLanguage('/notice-templates', language), label: isZh ? '通知模板' : 'Notice Templates' },
      ],
    },
    {
      label: isZh ? '活動管理' : 'Event Management',
      items: [
        { href: withPortalLanguage('/events', language), label: isZh ? '活動' : 'Registration Master' },
        { href: withPortalLanguage('/appointments', language), label: isZh ? '預約' : 'Appointment Master' },
      ],
    },
    {
      label: isZh ? '用戶管理' : 'User Management',
      items: [
        { href: withPortalLanguage('/partitions', language), label: isZh ? '分區' : 'User Partition' },
        { href: withPortalLanguage('/groups', language), label: isZh ? '用戶群組' : 'User Group' },
        { href: withPortalLanguage('/profiles', language), label: isZh ? '用戶' : 'Users' },
        { href: withPortalLanguage('/notices', language), label: isZh ? '通知記錄' : 'Notice History' },
      ],
    },
    {
      label: isZh ? '其他' : 'Others',
      items: [
        { href: withPortalLanguage('/content', language), label: isZh ? '文件' : 'Useful Information' },
        { href: withPortalLanguage('/contact', language), label: isZh ? '聯絡我們' : 'Contact Us' },
      ],
    },
  ];
}

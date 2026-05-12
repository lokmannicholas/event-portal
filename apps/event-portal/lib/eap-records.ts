export type EapRecordKind =
  | 'template'
  | 'noticeTemplate'
  | 'event'
  | 'eform'
  | 'appointment'
  | 'partition'
  | 'group'
  | 'profile'
  | 'portalDocument'
  | 'contactInfo';

export type NoticeQuery = {
  notice?: string;
  title?: string;
  message?: string;
  page?: string;
};

export const eapRecordConfig: Record<
  EapRecordKind,
  {
    singularLabel: string;
    listTitle: string;
    listPath: string;
  }
> = {
  template: {
    singularLabel: 'Template',
    listTitle: 'Template Master',
    listPath: '/templates',
  },
  noticeTemplate: {
    singularLabel: 'Notice Template',
    listTitle: 'Notice Template Master',
    listPath: '/notice-templates',
  },
  event: {
    singularLabel: 'Event',
    listTitle: 'Registration Master',
    listPath: '/events',
  },
  eform: {
    singularLabel: 'E-Form',
    listTitle: 'E-Form Master',
    listPath: '/eforms',
  },
  appointment: {
    singularLabel: 'Appointment',
    listTitle: 'Appointment Master',
    listPath: '/appointments',
  },
  partition: {
    singularLabel: 'Partition',
    listTitle: 'User Partition',
    listPath: '/partitions',
  },
  group: {
    singularLabel: 'Group',
    listTitle: 'User Group',
    listPath: '/groups',
  },
  profile: {
    singularLabel: 'User',
    listTitle: 'User Accounts',
    listPath: '/profiles',
  },
  portalDocument: {
    singularLabel: 'Portal Document',
    listTitle: 'Useful Information & Promotion',
    listPath: '/content',
  },
  contactInfo: {
    singularLabel: 'Contact Info',
    listTitle: 'Contact Us',
    listPath: '/contact',
  },
};

export function getRecordDetailPath(kind: EapRecordKind, documentId: string) {
  return `${eapRecordConfig[kind].listPath}/${documentId}`;
}

export function getRecordCreatePath(kind: EapRecordKind) {
  return `${eapRecordConfig[kind].listPath}/new`;
}

export function getNoticeContent(code?: string) {
  switch (code) {
    case 'created':
      return {
        title: 'Record created',
        description: 'The record was saved and you are now viewing its detail page.',
      };
    case 'updated':
      return {
        title: 'Record updated',
        description: 'The latest changes were submitted from the detail page.',
      };
    case 'duplicated':
      return {
        title: 'Record duplicated',
        description: 'A copy of the selected record was created and opened in its detail page.',
      };
    case 'published':
      return {
        title: 'Event published',
        description: 'The event was released to ERP and is now marked as published.',
      };
    case 'unpublished':
      return {
        title: 'Event unpublished',
        description: 'The event was removed from ERP publication and returned to draft visibility.',
      };
    case 'disabled':
      return {
        title: 'Event disabled',
        description: 'The event was disabled and hidden from ERP publication.',
      };
    case 'notices-sent':
      return {
        title: 'Notices sent',
        description: 'The selected notice batch has been processed. Check the notice history for sent and failed records.',
      };
    case 'create-failed':
      return {
        title: 'Create failed',
        description: 'The create form was submitted to Strapi, but the record was not saved. Check the Strapi response or server logs.',
      };
    case 'update-failed':
      return {
        title: 'Update failed',
        description: 'The update form was submitted to Strapi, but the record was not saved. Check the Strapi response or server logs.',
      };
    case 'duplicate-failed':
      return {
        title: 'Duplicate failed',
        description: 'The duplicate action was submitted to Strapi, but the copied record was not saved. Check the Strapi response or server logs.',
      };
    case 'publish-failed':
      return {
        title: 'Publish failed',
        description: 'The event could not be published to ERP. Check the Strapi response or server logs.',
      };
    case 'unpublish-failed':
      return {
        title: 'Unpublish failed',
        description: 'The event could not be unpublished from ERP. Check the Strapi response or server logs.',
      };
    case 'disable-failed':
      return {
        title: 'Disable failed',
        description: 'The event could not be disabled. Check the Strapi response or server logs.',
      };
    case 'notices-send-failed':
      return {
        title: 'Notice send failed',
        description: 'The manual notice batch could not be processed. Check the Strapi response or server logs.',
      };
    default:
      return undefined;
  }
}

export function getNoticeQueryString(code: string, title?: string, message?: string) {
  const params = new URLSearchParams({ notice: code });

  if (title) {
    params.set('title', title);
  }

  if (message) {
    params.set('message', message);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

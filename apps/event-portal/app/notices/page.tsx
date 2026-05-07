import { ActionLink, ActionRow } from '../../components/admin-forms';
import { Card, PaginationControls, SimpleTable, Stack, StatusBadge } from '@event-portal/ui';
import { EapShell } from '../../components/eap-shell';
import { getNotices } from '../../lib/api';
import type { NoticeQuery } from '../../lib/eap-records';
import { NoticeBanner } from '../../components/admin-forms';
import { paginateItems } from '../../lib/pagination';

type PageProps = {
  searchParams?: Promise<NoticeQuery>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const notices = await getNotices();
  const pagination = paginateItems(notices, query);

  return (
    <EapShell title="Notice History" subtitle="Track sent, pending, and failed participant notices, including delivery errors.">
      <Stack>
        <ActionRow>
          <ActionLink href="/notices/send" label="Send notices" />
        </ActionRow>
        <NoticeBanner code={query.notice} title={query.title} description={query.message} />

        <Card title="Notice history" description="Every send attempt is persisted here, including failures and delivery errors.">
          <SimpleTable
            columns={[
              { key: 'createdAt', label: 'Created' },
              { key: 'status', label: 'Status' },
              { key: 'channel', label: 'Channel' },
              { key: 'recipient', label: 'Recipient' },
              { key: 'template', label: 'Template' },
              { key: 'event', label: 'Event' },
              { key: 'detail', label: 'Detail' },
            ]}
            rows={pagination.items.map((notice) => ({
              createdAt: notice.createdAt ?? '-',
              status: <StatusBadge value={notice.status} />,
              channel: notice.channel,
              recipient: notice.recipient,
              template: notice.templateName ?? '-',
              event: notice.eventName ?? '-',
              detail: <a href={`/notices/${notice.documentId}`}>Open record</a>,
            }))}
          />
          <PaginationControls basePath="/notices" searchParams={query} pagination={pagination} itemLabel="notices" />
        </Card>
      </Stack>
    </EapShell>
  );
}

import { Card, EmptyState, PaginationControls, SimpleTable, Stack, StatusBadge } from '@event-portal/ui';
import { EcpShell } from '../../../../components/ecp-shell';
import { getEcpEvents } from '../../../../lib/ecp-api';
import { paginateItems } from '../../../../lib/pagination';
import { getPortalText } from '../../../../lib/portal-language';
import { getPortalLanguageFromCookies } from '../../../../lib/portal-language.server';

type PageProps = {
  params: Promise<{ groupCode: string }>;
  searchParams?: Promise<{ page?: string }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const [{ groupCode }, query] = await Promise.all([params, searchParams]);
  const language = await getPortalLanguageFromCookies();
  const data = await getEcpEvents(groupCode);
  const pagination = paginateItems(data, query ?? {});
  const copy = {
    title: getPortalText(language, 'Event Appointment Master', '活動預約主檔'),
    subtitle: getPortalText(language, 'Group-scoped event visibility and appointment access.', '按群組範圍顯示活動及其預約存取。'),
    emptyTitle: getPortalText(language, 'No event found', '找不到活動'),
    emptyDescription: getPortalText(language, 'No event is currently visible for this client group.', '此客戶群組目前沒有可見活動。'),
    cardTitle: getPortalText(language, 'Client events', '客戶活動'),
    cardDescription: getPortalText(language, 'Each event opens its own ERP registration route with either `/e/public/{uuid}` or `/e/private/{uuid}`.', '每個活動都會以 `/e/public/{uuid}` 或 `/e/private/{uuid}` 形式開啟其專屬 ERP 登記路徑。'),
    event: getPortalText(language, 'Event', '活動'),
    partition: getPortalText(language, 'Partition', '分區'),
    eventWindow: getPortalText(language, 'Event Window', '活動日期'),
    status: getPortalText(language, 'Status', '狀態'),
    detail: getPortalText(language, 'Detail', '詳情'),
    viewEvent: getPortalText(language, 'View event', '查看活動'),
    itemLabel: getPortalText(language, 'events', '活動'),
  };

  return (
    <EcpShell
      title={copy.title}
      subtitle={copy.subtitle}
      groupCode={groupCode}
    >
      <Stack>
        {data.length === 0 ? (
          <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
        ) : (
          <Card title={copy.cardTitle} description={copy.cardDescription}>
            <SimpleTable
              columns={[
                { key: 'event', label: copy.event },
                { key: 'partition', label: copy.partition },
                { key: 'eventWindow', label: copy.eventWindow },
                { key: 'status', label: copy.status },
                { key: 'detail', label: copy.detail },
              ]}
              rows={pagination.items.map((event) => ({
                event: event.eventName,
                partition: event.partitionCode,
                eventWindow: `${event.eventStartDate} → ${event.eventEndDate}`,
                status: <StatusBadge value={event.status} />,
                detail: <a href={`/ecp/${groupCode}/events/${event.eventCode}`}>{copy.viewEvent}</a>,
              }))}
            />
            <PaginationControls
              basePath={`/ecp/${groupCode}/events`}
              searchParams={query ?? {}}
              pagination={pagination}
              itemLabel={copy.itemLabel}
              language={language}
            />
          </Card>
        )}
      </Stack>
    </EcpShell>
  );
}

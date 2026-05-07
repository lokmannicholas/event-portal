import { Card, EmptyState, PaginationControls, SimpleTable, Stack, StatusBadge } from '@event-portal/ui';
import { EcpShell } from '../../../../components/ecp-shell';
import { getEcpEvents } from '../../../../lib/ecp-api';
import { paginateItems } from '../../../../lib/pagination';

type PageProps = {
  params: Promise<{ groupCode: string }>;
  searchParams?: Promise<{ page?: string }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const [{ groupCode }, query] = await Promise.all([params, searchParams]);
  const data = await getEcpEvents(groupCode);
  const pagination = paginateItems(data, query ?? {});

  return (
    <EcpShell
      title="Event Appointment Master"
      subtitle="Group-scoped event visibility and appointment access."
      groupCode={groupCode}
    >
      <Stack>
        {data.length === 0 ? (
          <EmptyState title="No event found" description="No event is currently visible for this client group." />
        ) : (
          <Card title="Client events" description="Each event opens its own ERP registration route under the partition public portal.">
            <SimpleTable
              columns={[
                { key: 'event', label: 'Event' },
                { key: 'partition', label: 'Partition' },
                { key: 'eventWindow', label: 'Event Window' },
                { key: 'status', label: 'Status' },
                { key: 'detail', label: 'Detail' },
              ]}
              rows={pagination.items.map((event) => ({
                event: event.eventName,
                partition: event.partitionCode,
                eventWindow: `${event.eventStartDate} → ${event.eventEndDate}`,
                status: <StatusBadge value={event.status} />,
                detail: <a href={`/ecp/${groupCode}/events/${event.eventCode}`}>View event</a>,
              }))}
            />
            <PaginationControls
              basePath={`/ecp/${groupCode}/events`}
              searchParams={query ?? {}}
              pagination={pagination}
              itemLabel="events"
            />
          </Card>
        )}
      </Stack>
    </EcpShell>
  );
}

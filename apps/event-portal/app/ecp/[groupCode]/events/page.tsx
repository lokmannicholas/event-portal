import { Card, EmptyState, SimpleTable, Stack, StatusBadge } from '@event-portal/ui';
import { EcpShell } from '../../../../components/ecp-shell';
import { getEcpEvents } from '../../../../lib/ecp-api';

type PageProps = {
  params: Promise<{ groupCode: string }>;
};

export default async function Page({ params }: PageProps) {
  const { groupCode } = await params;
  const data = await getEcpEvents(groupCode);

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
              rows={data.map((event) => ({
                event: event.eventName,
                partition: event.partitionCode,
                eventWindow: `${event.eventStartDate} → ${event.eventEndDate}`,
                status: <StatusBadge value={event.status} />,
                detail: <a href={`/ecp/${groupCode}/events/${event.eventCode}`}>View event</a>,
              }))}
            />
          </Card>
        )}
      </Stack>
    </EcpShell>
  );
}

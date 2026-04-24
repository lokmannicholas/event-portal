import { Card, EmptyState, SimpleTable, SplitGrid, Stack, StatGrid, StatusBadge } from '@flu-vax/ui';
import { EcpShell } from '../../../components/ecp-shell';
import { getEcpDashboard, getEcpEvents } from '../../../lib/ecp-api';

type PageProps = {
  params: Promise<{ groupCode: string }>;
};

export default async function Page({ params }: PageProps) {
  const { groupCode } = await params;
  const [dashboard, events] = await Promise.all([
    getEcpDashboard(groupCode),
    getEcpEvents(groupCode),
  ]);

  return (
    <EcpShell
      title="Dashboard"
      subtitle={`HR-facing portal for group ${groupCode}.`}
      groupCode={groupCode}
    >
      <Stack>
        <StatGrid items={dashboard.stats} />

        {events.length === 0 ? (
          <EmptyState title="No visible events" description="This group does not currently have any visible event in its linked partitions." />
        ) : (
          <SplitGrid
            left={
              <Card title="Visible events" description="Client HR users only see events within the partitions linked to their group.">
                <SimpleTable
                  columns={[
                    { key: 'event', label: 'Event' },
                    { key: 'window', label: 'Registration Window' },
                    { key: 'status', label: 'Status' },
                    { key: 'visit', label: 'ERP Link' },
                  ]}
                  rows={events.map((event) => ({
                    event: (
                      <div>
                        <div style={{ fontWeight: 700 }}>{event.eventName}</div>
                        <div style={{ color: '#5b677a', fontSize: '13px' }}>{event.location}</div>
                      </div>
                    ),
                    window: `${event.registrationStartDate} → ${event.registrationEndDate}`,
                    status: <StatusBadge value={event.status} />,
                    visit: <a href={event.publicUrl}>Visit ERP</a>,
                  }))}
                />
              </Card>
            }
            right={
              <Card title="What this client portal covers" description="The detailed management actions stay in EAP, while ECP focuses on visibility, cancellation, exports, and participant monitoring.">
                <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.8 }}>
                  <li>View appointments by event</li>
                  <li>Open the ERP event registration page</li>
                  <li>Download QR / URL payload details</li>
                  <li>Cancel appointments with record retention</li>
                </ul>
              </Card>
            }
          />
        )}
      </Stack>
    </EcpShell>
  );
}

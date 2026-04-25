import { Card, SimpleTable, SplitGrid, Stack, StatGrid, StatusBadge } from '@flu-vax/ui';
import { EapShell } from '../components/eap-shell';
import { getAppointments, getDashboard, getEvents } from '../lib/api';

export default async function Page() {
  const [dashboard, eventRows, appointmentRows] = await Promise.all([
    getDashboard(),
    getEvents(),
    getAppointments(),
  ]);

  return (
    <EapShell
      title="Dashboard"
      subtitle="Admin entry point for partitions, templates, event release, appointments, portal documents, and support content."
    >
      <Stack>
        <StatGrid items={dashboard.stats} />

        <SplitGrid
          left={
            <Card
              title="Released and draft events"
              description="Events move from Draft to Released or Active after release. Disabled events remain visible, while Closed events disappear from ERP."
            >
              <SimpleTable
                columns={[
                  { key: 'eventName', label: 'Event' },
                  { key: 'partition', label: 'Partition' },
                  { key: 'window', label: 'Registration Window' },
                  { key: 'status', label: 'Status' },
                ]}
                rows={eventRows.map((event) => ({
                  eventName: (
                    <div>
                      <div style={{ fontWeight: 700 }}>{event.eventName}</div>
                      <div style={{ color: '#5b677a', fontSize: '13px' }}>{event.location}</div>
                    </div>
                  ),
                  partition: event.partitionCode,
                  window: `${event.registrationStartDate} → ${event.registrationEndDate}`,
                  status: <StatusBadge value={event.status} />,
                }))}
              />
            </Card>
          }
          right={
            <Card
              title="Operational reminders"
              description="This scaffold keeps the workflow boundaries visible before wiring in authentication, notification providers, and transaction-safe slot locking."
            >
              <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.8 }}>
                <li>Generate events from templates</li>
                <li>Release only when registration rules are correct</li>
                <li>Keep cancellation history for audit purposes</li>
                <li>Use partition-level URLs and QR payloads</li>
              </ul>
            </Card>
          }
        />

        <Card
          title="Recent appointments"
          description="The appointment master is a real-time read model over booking data coming from ERP and cancellation actions from EAP / ECP."
        >
          <SimpleTable
            columns={[
              { key: 'booking', label: 'Booking' },
              { key: 'participant', label: 'Participant' },
              { key: 'slot', label: 'Date / Slot' },
              { key: 'status', label: 'Status' },
            ]}
            rows={appointmentRows.slice(0, 5).map((appointment) => ({
              booking: appointment.bookingReference,
              participant: (
                <div>
                  <div style={{ fontWeight: 700 }}>{appointment.participantName}</div>
                  <div style={{ color: '#5b677a', fontSize: '13px' }}>{appointment.registeredEmail ?? appointment.mobileNumber ?? '-'}</div>
                </div>
              ),
              slot: `${appointment.appointmentDate} ${appointment.appointmentStartTime}-${appointment.appointmentEndTime}`,
              status: <StatusBadge value={appointment.status} />,
            }))}
          />
        </Card>
      </Stack>
    </EapShell>
  );
}

import { ActionLink, ActionRow } from '../../components/admin-forms';
import { Card, SimpleTable, Stack, StatusBadge } from '@flu-vax/ui';
import { EapShell } from '../../components/eap-shell';
import { getAppointments } from '../../lib/api';

export default async function Page() {
  const data = await getAppointments();

  return (
    <EapShell
      title="Event Appointment Master"
      subtitle="Cross-portal booking records, cancellation state, and participant snapshot fields."
    >
      <Stack>
        <ActionRow>
          <ActionLink href="/appointments/new" label="Create appointment" />
        </ActionRow>

        <Card title="Appointments" description="Cancellation should release capacity, notify the participant, and keep the historical record. Open a booking to update it.">
          <SimpleTable
            columns={[
              { key: 'reference', label: 'Reference' },
              { key: 'event', label: 'Event' },
              { key: 'participant', label: 'Participant' },
              { key: 'contact', label: 'Contact' },
              { key: 'slot', label: 'Date / Slot' },
              { key: 'status', label: 'Status' },
              { key: 'detail', label: 'Detail' },
            ]}
            rows={data.map((appointment) => ({
              reference: <a href={`/appointments/${appointment.documentId}`}>{appointment.bookingReference}</a>,
              event: appointment.eventName,
              participant: (
                <div>
                  <div style={{ fontWeight: 700 }}>{appointment.participantName}</div>
                  <div style={{ color: '#5b677a', fontSize: '13px' }}>Staff: {appointment.staffNumber ?? '-'}</div>
                </div>
              ),
              contact: appointment.registeredEmail ?? appointment.mobileNumber ?? '-',
              slot: `${appointment.appointmentDate} ${appointment.appointmentStartTime}-${appointment.appointmentEndTime}`,
              status: <StatusBadge value={appointment.status} />,
              detail: <a href={`/appointments/${appointment.documentId}`}>Open record</a>,
            }))}
          />
        </Card>
      </Stack>
    </EapShell>
  );
}

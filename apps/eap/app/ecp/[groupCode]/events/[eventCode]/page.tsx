import { Card, EmptyState, KeyValueList, SimpleTable, SplitGrid, Stack, StatusBadge } from '@flu-vax/ui';
import { EcpShell } from '../../../../../components/ecp-shell';
import { getEcpAppointmentsForEvent, getEcpEventDetail } from '../../../../../lib/ecp-api';

type PageProps = {
  params: Promise<{ eventCode: string; groupCode: string }>;
};

export default async function Page({ params }: PageProps) {
  const { eventCode, groupCode } = await params;
  const detail = await getEcpEventDetail(eventCode, groupCode);

  if (!detail) {
    return (
      <EcpShell title="Event detail" subtitle="Requested event could not be found." groupCode={groupCode}>
        <EmptyState title="Event not found" description="Check the event code or make sure the event belongs to this client group scope." />
      </EcpShell>
    );
  }

  const appointments = await getEcpAppointmentsForEvent(eventCode, groupCode);

  return (
    <EcpShell
      title={detail.event.eventName}
      subtitle="Client view over ERP registration output, event metadata, and appointment records."
      groupCode={groupCode}
    >
      <Stack>
        <SplitGrid
          left={
            <Card title="Event detail" description="The client portal can open the ERP public registration page, display QR payload scope, and review registrations.">
              <KeyValueList
                items={[
                  { label: 'Event code', value: detail.event.eventCode },
                  { label: 'Company', value: detail.event.companyName },
                  { label: 'Location', value: detail.event.location },
                  { label: 'Partition', value: detail.event.partitionCode },
                  { label: 'Status', value: <StatusBadge value={detail.event.status} /> },
                  { label: 'ERP URL', value: <a href={detail.event.publicUrl}>{detail.event.publicUrl}</a> },
                  { label: 'QR payload', value: detail.event.qrPayload },
                ]}
              />
            </Card>
          }
          right={
            <Card title="Participant fields" description="These fields come from the event schema snapshot created from the template.">
              <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.8 }}>
                {detail.event.fields.map((field) => (
                  <li key={field.fieldKey}>
                    {field.labelEn} {field.required ? '(required)' : '(optional)'}
                  </li>
                ))}
              </ul>
            </Card>
          }
        />

        <Card title="Appointments" description="HR cancellation remains visible in history and should trigger quota release and participant notification.">
          <SimpleTable
            columns={[
              { key: 'reference', label: 'Reference' },
              { key: 'participant', label: 'Participant' },
              { key: 'contact', label: 'Contact' },
              { key: 'slot', label: 'Date / Slot' },
              { key: 'status', label: 'Status' },
            ]}
            rows={appointments.map((appointment) => ({
              reference: appointment.bookingReference,
              participant: appointment.participantName,
              contact: appointment.registeredEmail ?? appointment.mobileNumber ?? '-',
              slot: `${appointment.appointmentDate} ${appointment.appointmentStartTime}-${appointment.appointmentEndTime}`,
              status: <StatusBadge value={appointment.status} />,
            }))}
          />
        </Card>
      </Stack>
    </EcpShell>
  );
}

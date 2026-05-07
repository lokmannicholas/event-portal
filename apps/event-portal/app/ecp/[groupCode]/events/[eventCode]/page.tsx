import { Card, EmptyState, KeyValueList, SimpleTable, SplitGrid, Stack, StatusBadge } from '@event-portal/ui';
import { EcpAppointmentTable } from '../../../../../components/ecp-appointment-table';
import { EcpShell } from '../../../../../components/ecp-shell';
import { ErpPathSummary } from '../../../../../components/erp-path-summary';
import { getEcpAppointmentsForEvent, getEcpEventDetail } from '../../../../../lib/ecp-api';

type PageProps = {
  params: Promise<{ eventCode: string; groupCode: string }>;
};

function formatDisplayTime(value: string | undefined) {
  if (!value) {
    return '-';
  }

  return value.slice(0, 5);
}

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
  const slotRows = detail.event.dates.flatMap((date) =>
    date.slots.map((slot) => ({
      date: date.date,
      time: `${formatDisplayTime(slot.startTime)}-${formatDisplayTime(slot.endTime)}`,
      enabled: date.enabled && slot.enabled ? 'Yes' : 'No',
      quota: String(slot.quota),
      remaining: String(slot.remaining),
    })),
  );

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
                  { label: 'Registration start', value: detail.event.registrationStartDate },
                  { label: 'Registration end', value: detail.event.registrationEndDate },
                  { label: 'Event start', value: detail.event.eventStartDate },
                  { label: 'Event end', value: detail.event.eventEndDate },
                  { label: 'Day start time', value: formatDisplayTime(detail.event.dayStartTime) },
                  { label: 'Day end time', value: formatDisplayTime(detail.event.dayEndTime) },
                  { label: 'Status', value: <StatusBadge value={detail.event.status} /> },
                  { label: 'ERP URL', value: <a href={detail.event.publicUrl}>{detail.event.publicUrl}</a> },
                  { label: 'QR payload', value: <ErpPathSummary url={detail.event.qrPayload} /> },
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

        <Card title="Timeslot availability" description="Registration slots remain visible here with the configured quota and current remaining availability.">
          {slotRows.length === 0 ? (
            <EmptyState title="No timeslots configured" description="This event does not have any available slot rows yet." />
          ) : (
            <SimpleTable
              columns={[
                { key: 'date', label: 'Date' },
                { key: 'time', label: 'Timeslot' },
                { key: 'enabled', label: 'Enabled' },
                { key: 'quota', label: 'Quota' },
                { key: 'remaining', label: 'Remaining' },
              ]}
              rows={slotRows}
            />
          )}
        </Card>

        <Card title="Appointments" description="HR cancellation remains visible in history and should trigger quota release and participant notification.">
          <EcpAppointmentTable appointments={appointments} groupCode={groupCode} eventCode={eventCode} />
        </Card>
      </Stack>
    </EcpShell>
  );
}

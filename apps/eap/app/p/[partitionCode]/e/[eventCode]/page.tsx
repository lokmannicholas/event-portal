import { Card, EmptyState, KeyValueList, SplitGrid, Stack, StatusBadge } from '@flu-vax/ui';
import { BookingForm } from '../../../../../components/booking-form';
import { ErpShell } from '../../../../../components/erp-shell';
import { getErpEventDetail } from '../../../../../lib/erp-api';

type PageProps = {
  params: Promise<{ eventCode: string; partitionCode: string }>;
};

export default async function Page({ params }: PageProps) {
  const { eventCode, partitionCode } = await params;
  const detail = await getErpEventDetail(eventCode, partitionCode);

  if (!detail) {
    return (
      <ErpShell title="Event detail" subtitle="The requested event could not be found." partitionCode={partitionCode}>
        <EmptyState title="Event not found" description="Check the partition link, event code, or contact QHMS support for assistance." />
      </ErpShell>
    );
  }

  return (
    <ErpShell
      title={detail.event.eventName}
      subtitle="Public event detail with real-time slot availability, temporary hold behavior, and participant registration form."
      partitionCode={partitionCode}
    >
      <Stack>
        <SplitGrid
          left={
            <Card title="Event detail" description="Published events remain visible according to status, partition, and registration-window rules.">
              <KeyValueList
                items={[
                  { label: 'Event code', value: detail.event.eventCode },
                  { label: 'Company', value: detail.event.companyName },
                  { label: 'Location', value: detail.event.location },
                  { label: 'Description', value: detail.event.description ?? '-' },
                  { label: 'Event window', value: `${detail.event.eventStartDate} → ${detail.event.eventEndDate}` },
                  { label: 'Registration window', value: `${detail.event.registrationStartDate} → ${detail.event.registrationEndDate}` },
                  { label: 'Status', value: <StatusBadge value={detail.event.status} /> },
                ]}
              />
            </Card>
          }
          right={
            <Card title="Event notes" description="This mirrors the free-text notes entered in the event registration form.">
              <div style={{ lineHeight: 1.7 }}>{detail.event.notes ?? 'No additional notes.'}</div>
            </Card>
          }
        />

        <BookingForm detail={detail} />
      </Stack>
    </ErpShell>
  );
}

import { Card, EmptyState, KeyValueList, Stack } from '@flu-vax/ui';
import { ActionLink, ActionRow } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { getNotice } from '../../../lib/api';

type PageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { documentId } = await params;
  const record = await getNotice(documentId);

  if (!record) {
    return (
      <EapShell title="Notice Detail" subtitle="The requested notice record could not be found.">
        <Stack>
          <ActionRow>
            <ActionLink href="/notices" label="Back to Notice History" variant="secondary" />
          </ActionRow>
          <EmptyState title="Notice not found" description="Check the selected record id or open another notice from the history list." />
        </Stack>
      </EapShell>
    );
  }

  return (
    <EapShell title={record.templateName ?? 'Notice Detail'} subtitle="Delivery history is stored for each sent participant notice.">
      <Stack>
        <ActionRow>
          <ActionLink href="/notices" label="Back to Notice History" variant="secondary" />
          <ActionLink href="/notices/send" label="Send notices" />
        </ActionRow>

        <Card title="Notice summary" description="Delivery result, recipient, and source record linkage.">
          <KeyValueList
            items={[
              { label: 'Document id', value: record.documentId },
              { label: 'Status', value: record.status },
              { label: 'Channel', value: record.channel },
              { label: 'Recipient', value: record.recipient },
              { label: 'Template', value: record.templateName ?? '-' },
              { label: 'Event', value: record.eventName ?? '-' },
              { label: 'Booking reference', value: record.bookingReference ?? '-' },
              { label: 'Sent at', value: record.sentAt ?? '-' },
              { label: 'Error', value: record.errorMessage ?? '-' },
            ]}
          />
        </Card>

        <Card title="Plain text content" description="Stored plain text body used for delivery.">
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{record.plainTextBody}</pre>
        </Card>

        <Card title="HTML content" description="Stored HTML body snapshot used for email delivery.">
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{record.htmlBody || '-'}</pre>
        </Card>
      </Stack>
    </EapShell>
  );
}

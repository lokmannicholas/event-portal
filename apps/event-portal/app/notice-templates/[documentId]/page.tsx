import { Card, EmptyState, KeyValueList, Stack } from '@event-portal/ui';
import { updateRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, Field, FormGrid, NoticeBanner, SelectField, SubmitRow, TextAreaField } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { getNoticeTemplate } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';

type PageProps = {
  params: Promise<{ documentId: string }>;
  searchParams?: Promise<NoticeQuery>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const [{ documentId }, query] = await Promise.all([params, searchParams]);
  const record = await getNoticeTemplate(documentId);

  if (!record) {
    return (
      <EapShell title="Notice Template Detail" subtitle="The requested notice template could not be found.">
        <Stack>
          <ActionRow>
            <ActionLink href="/notice-templates" label="Back to Notice Template Master" variant="secondary" />
          </ActionRow>
          <EmptyState title="Notice template not found" description="Check the selected record id or create a new notice template." />
        </Stack>
      </EapShell>
    );
  }

  return (
    <EapShell title={record.name} subtitle="Update reusable notice content for email and SMS delivery.">
      <Stack>
        <ActionRow>
          <ActionLink href="/notice-templates" label="Back to Notice Template Master" variant="secondary" />
          <ActionLink href="/notice-templates/new" label="Create notice template" />
        </ActionRow>
        <NoticeBanner code={query?.notice} title={query?.title} description={query?.message} />

        <Card title="Notice template detail" description="Store reusable plain text and HTML content.">
          <form action={updateRecordAction.bind(null, 'noticeTemplate', record.documentId)}>
            <Stack gap={16}>
              <FormGrid>
                <Field label="Template name" name="name" defaultValue={record.name} required />
                <SelectField
                  label="Channel"
                  name="channel"
                  defaultValue={record.channel}
                  options={[
                    { value: 'EMAIL', label: 'EMAIL' },
                    { value: 'SMS', label: 'SMS' },
                  ]}
                />
                <Field label="Subject" name="subject" defaultValue={record.subject} />
                <Field label="Sort order" name="sortOrder" type="number" defaultValue={record.sortOrder} required />
                <SelectField
                  label="Active"
                  name="active"
                  defaultValue={record.active ? 'true' : 'false'}
                  options={[
                    { value: 'true', label: 'ACTIVE' },
                    { value: 'false', label: 'DISABLED' },
                  ]}
                />
              </FormGrid>

              <TextAreaField label="Description" name="description" defaultValue={record.description} rows={3} />
              <TextAreaField label="Plain text body" name="plainTextBody" defaultValue={record.plainTextBody} rows={10} />
              <TextAreaField label="HTML body" name="htmlBody" defaultValue={record.htmlBody} rows={12} />

              <SubmitRow submitLabel="Update notice template" cancelHref="/notice-templates" cancelLabel="Back to list" />
            </Stack>
          </form>
        </Card>

        <Card title="Template summary" description="Current record snapshot and key fields.">
          <KeyValueList
            items={[
              { label: 'Document id', value: record.documentId },
              { label: 'Channel', value: record.channel },
              { label: 'Subject', value: record.subject || '-' },
              { label: 'Active', value: record.active ? 'Yes' : 'No' },
            ]}
          />
        </Card>
      </Stack>
    </EapShell>
  );
}

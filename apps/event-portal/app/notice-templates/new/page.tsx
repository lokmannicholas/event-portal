import { Card, Stack } from '@event-portal/ui';
import { createRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, Field, FormGrid, NoticeBanner, SelectField, SubmitRow, TextAreaField } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import type { NoticeQuery } from '../../../lib/eap-records';

type PageProps = {
  searchParams?: Promise<NoticeQuery>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};

  return (
    <EapShell title="Create Notice Template" subtitle="Create a reusable email or SMS template for participant notifications.">
      <Stack>
        <ActionRow>
          <ActionLink href="/notice-templates" label="Back to Notice Template Master" variant="secondary" />
        </ActionRow>
        <NoticeBanner code={query.notice} title={query.title} description={query.message} />

        <Card title="Notice template setup" description="Store both plain text and optional HTML so notices can be delivered through email or SMS.">
          <form action={createRecordAction.bind(null, 'noticeTemplate')}>
            <Stack gap={16}>
              <FormGrid>
                <Field label="Template name" name="name" required />
                <SelectField
                  label="Channel"
                  name="channel"
                  defaultValue="EMAIL"
                  options={[
                    { value: 'EMAIL', label: 'EMAIL' },
                    { value: 'SMS', label: 'SMS' },
                  ]}
                />
                <Field label="Subject" name="subject" />
                <Field label="Sort order" name="sortOrder" type="number" defaultValue={0} required />
                <SelectField
                  label="Active"
                  name="active"
                  defaultValue="true"
                  options={[
                    { value: 'true', label: 'ACTIVE' },
                    { value: 'false', label: 'DISABLED' },
                  ]}
                />
              </FormGrid>

              <TextAreaField label="Description" name="description" rows={3} />
              <TextAreaField label="Plain text body" name="plainTextBody" rows={10} />
              <TextAreaField label="HTML body" name="htmlBody" rows={12} />

              <SubmitRow submitLabel="Create notice template" cancelHref="/notice-templates" cancelLabel="Cancel" />
            </Stack>
          </form>
        </Card>
      </Stack>
    </EapShell>
  );
}

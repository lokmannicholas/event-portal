import { Card, Stack } from '@flu-vax/ui';
import { createRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, Field, FileField, FormGrid, NoticeBanner, SelectField, SubmitRow, TextAreaField } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { getGroups } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';

type PageProps = {
  searchParams?: Promise<NoticeQuery>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const groupRows = await getGroups();

  return (
    <EapShell title="Create Partition" subtitle="Create a partition record that defines ERP entry scope and event access scope.">
      <Stack>
        <ActionRow>
          <ActionLink href="/partitions" label="Back to User Partition" variant="secondary" />
        </ActionRow>
        <NoticeBanner code={query.notice} title={query.title} description={query.message} />

        <Card title="Partition setup" description="Assign this partition to one owning user group.">
          <form action={createRecordAction.bind(null, 'partition')} encType="multipart/form-data">
            <Stack gap={16}>
              <FormGrid>
                <Field label="Partition code" name="code" required />
                <Field label="Description" name="description" required />
                <Field label="Slug" name="slug" required />
                <SelectField
                  label="Status"
                  name="status"
                  defaultValue="ACTIVE"
                  options={[
                    { value: 'ACTIVE', label: 'ACTIVE' },
                    { value: 'DISABLED', label: 'DISABLED' },
                  ]}
                />
                <SelectField
                  label="Owning group"
                  name="userGroupDocumentId"
                  defaultValue=""
                  options={[{ value: '', label: 'Unassigned' }, ...groupRows.map((item) => ({ value: item.documentId, label: `${item.code} · ${item.description}` }))]}
                />
              </FormGrid>

              <FileField
                label="Logo"
                name="logo"
                accept="image/*"
                helperText="Optional image shown on the ERP landing page for this partition."
              />
              <FileField
                label="Banners"
                name="banners"
                accept="image/*"
                multiple
                helperText="Optional banner images displayed on the ERP landing page."
              />
              <TextAreaField label="Remarks" name="remarks" rows={3} />

              <SubmitRow submitLabel="Create partition" cancelHref="/partitions" cancelLabel="Cancel" />
            </Stack>
          </form>
        </Card>
      </Stack>
    </EapShell>
  );
}

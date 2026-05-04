import { Card, Stack } from '@event-portal/ui';
import { createRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, Field, FileField, FormGrid, MultiSelectField, NoticeBanner, SelectField, SubmitRow, TextAreaField } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { getPartitions } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';

type PageProps = {
  searchParams?: Promise<NoticeQuery>;
};

const portalTargetOptions = [
  { value: 'ECP', label: 'ECP' },
  { value: 'ERP', label: 'ERP' },
];

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const partitions = await getPartitions();

  return (
    <EapShell title="Create Portal Document" subtitle="Upload a file and publish it to one or more target portals.">
      <Stack>
        <ActionRow>
          <ActionLink href="/content" label="Back to Useful Information" variant="secondary" />
        </ActionRow>
        <NoticeBanner code={query.notice} title={query.title} description={query.message} />

        <Card title="Portal document setup" description="Files can be scoped to ECP, ERP, and optionally to a specific partition.">
          <form action={createRecordAction.bind(null, 'portalDocument')}>
            <Stack gap={16}>
              <FormGrid>
                <Field label="Title (EN)" name="titleEn" required />
                <Field label="Title (ZH)" name="titleZh" />
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
                <SelectField
                  label="Partition"
                  name="partitionDocumentId"
                  defaultValue=""
                  options={[{ value: '', label: 'All partitions' }, ...partitions.map((item) => ({ value: item.documentId, label: `${item.code} · ${item.description}` }))]}
                />
              </FormGrid>

              <MultiSelectField label="Portal targets" name="portalTargets" defaultValue={['ECP', 'ERP']} options={portalTargetOptions} size={2} />
              <TextAreaField label="Description (EN)" name="descriptionEn" rows={3} />
              <TextAreaField label="Description (ZH)" name="descriptionZh" rows={3} />
              <FileField label="Document file" name="file" helperText="Upload the file to be displayed in the selected target portals." />

              <SubmitRow submitLabel="Create document" cancelHref="/content" cancelLabel="Cancel" />
            </Stack>
          </form>
        </Card>
      </Stack>
    </EapShell>
  );
}

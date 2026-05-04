import { Card, EmptyState, KeyValueList, Stack } from '@event-portal/ui';
import { updateRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, Field, FileField, FormGrid, MultiSelectField, NoticeBanner, SelectField, SubmitRow, TextAreaField } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { getDocument, getPartitions } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';

type PageProps = {
  params: Promise<{ documentId: string }>;
  searchParams?: Promise<NoticeQuery>;
};

const portalTargetOptions = [
  { value: 'ECP', label: 'ECP' },
  { value: 'ERP', label: 'ERP' },
];

export default async function Page({ params, searchParams }: PageProps) {
  const [{ documentId }, query] = await Promise.all([params, searchParams]);
  const [record, partitions] = await Promise.all([getDocument(documentId), getPartitions()]);

  if (!record) {
    return (
      <EapShell title="Portal Document Detail" subtitle="The requested document record could not be found.">
        <Stack>
          <ActionRow>
            <ActionLink href="/content" label="Back to Useful Information" variant="secondary" />
          </ActionRow>
          <EmptyState title="Document not found" description="Check the selected record id or create a new portal document." />
        </Stack>
      </EapShell>
    );
  }

  return (
    <EapShell title={record.titleEn} subtitle="Update file publishing metadata and target portal visibility.">
      <Stack>
        <ActionRow>
          <ActionLink href="/content" label="Back to Useful Information" variant="secondary" />
          <ActionLink href="/content/new" label="Create document" />
        </ActionRow>
        <NoticeBanner code={query?.notice} title={query?.title} description={query?.message} />

        <Card title="Portal document detail" description="Upload a replacement file only when you need to swap the current asset.">
          <form action={updateRecordAction.bind(null, 'portalDocument', record.documentId)}>
            <Stack gap={16}>
              <FormGrid>
                <Field label="Title (EN)" name="titleEn" defaultValue={record.titleEn} required />
                <Field label="Title (ZH)" name="titleZh" defaultValue={record.titleZh} />
                <Field label="Sort order" name="sortOrder" type="number" defaultValue={record.sortOrder ?? 0} required />
                <SelectField
                  label="Active"
                  name="active"
                  defaultValue={record.active ? 'true' : 'false'}
                  options={[
                    { value: 'true', label: 'ACTIVE' },
                    { value: 'false', label: 'DISABLED' },
                  ]}
                />
                <SelectField
                  label="Partition"
                  name="partitionDocumentId"
                  defaultValue={record.partitionDocumentId ?? ''}
                  options={[{ value: '', label: 'All partitions' }, ...partitions.map((item) => ({ value: item.documentId, label: `${item.code} · ${item.description}` }))]}
                />
              </FormGrid>

              <MultiSelectField label="Portal targets" name="portalTargets" defaultValue={record.portalTargets.filter((item) => item === 'ECP' || item === 'ERP')} options={portalTargetOptions} size={2} />
              <TextAreaField label="Description (EN)" name="descriptionEn" defaultValue={record.descriptionEn} rows={3} />
              <TextAreaField label="Description (ZH)" name="descriptionZh" defaultValue={record.descriptionZh} rows={3} />
              <FileField label="Replace document file" name="file" helperText="Leave empty to keep the current uploaded file." />

              <SubmitRow submitLabel="Update document" cancelHref="/content" cancelLabel="Back to list" />
            </Stack>
          </form>
        </Card>

        <Card title="Document summary" description="Current file and target portal visibility.">
          <KeyValueList
            items={[
              { label: 'Document id', value: record.documentId },
              { label: 'Current file', value: record.downloadUrl ? <a href={record.downloadUrl}>{record.fileName}</a> : record.fileName },
              { label: 'Portal targets', value: record.portalTargets.join(', ') || '-' },
              { label: 'Partition', value: record.partitionCode ?? 'All partitions' },
            ]}
          />
        </Card>
      </Stack>
    </EapShell>
  );
}

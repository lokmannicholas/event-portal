import { Card, EmptyState, KeyValueList, Stack } from '@event-portal/ui';
import { updateRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, Field, FormGrid, MultiSelectField, NoticeBanner, SelectField, SubmitRow, TextAreaField } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { getContact, getPartitions } from '../../../lib/api';
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
  const [record, partitions] = await Promise.all([getContact(documentId), getPartitions()]);

  if (!record) {
    return (
      <EapShell title="Contact Info Detail" subtitle="The requested contact record could not be found.">
        <Stack>
          <ActionRow>
            <ActionLink href="/contact" label="Back to Contact Us" variant="secondary" />
          </ActionRow>
          <EmptyState title="Contact record not found" description="Check the selected record id or create a new support contact." />
        </Stack>
      </EapShell>
    );
  }

  return (
    <EapShell title={record.titleEn} subtitle="Update support contact information shared to ECP and ERP.">
      <Stack>
        <ActionRow>
          <ActionLink href="/contact" label="Back to Contact Us" variant="secondary" />
          <ActionLink href="/contact/new" label="Create contact info" />
        </ActionRow>
        <NoticeBanner code={query?.notice} title={query?.title} description={query?.message} />

        <Card title="Contact info detail" description="Use portal targets to control whether ECP, ERP, or both portals can read this record.">
          <form action={updateRecordAction.bind(null, 'contactInfo', record.documentId)}>
            <Stack gap={16}>
              <FormGrid>
                <Field label="Title (EN)" name="titleEn" defaultValue={record.titleEn} required />
                <Field label="Title (ZH)" name="titleZh" defaultValue={record.titleZh} />
                <Field label="Email" name="email" type="email" defaultValue={record.email} />
                <Field label="Phone" name="phone" defaultValue={record.phone} />
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
              <TextAreaField label="Address (EN)" name="addressEn" defaultValue={record.addressEn} rows={3} />
              <TextAreaField label="Address (ZH)" name="addressZh" defaultValue={record.addressZh} rows={3} />

              <SubmitRow submitLabel="Update contact info" cancelHref="/contact" cancelLabel="Back to list" />
            </Stack>
          </form>
        </Card>

        <Card title="Contact summary" description="Current portal targets and partition visibility.">
          <KeyValueList
            items={[
              { label: 'Document id', value: record.documentId },
              { label: 'Portal targets', value: record.portalTargets.join(', ') || '-' },
              { label: 'Partition', value: record.partitionCode ?? 'All partitions' },
              { label: 'Email', value: record.email ?? '-' },
              { label: 'Phone', value: record.phone ?? '-' },
            ]}
          />
        </Card>
      </Stack>
    </EapShell>
  );
}

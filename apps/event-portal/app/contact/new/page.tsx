import { Card, Stack } from '@event-portal/ui';
import { createRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, Field, FormGrid, MultiSelectField, NoticeBanner, SelectField, SubmitRow, TextAreaField } from '../../../components/admin-forms';
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
    <EapShell title="Create Contact Info" subtitle="Create a support contact record for ECP and ERP users.">
      <Stack>
        <ActionRow>
          <ActionLink href="/contact" label="Back to Contact Us" variant="secondary" />
        </ActionRow>
        <NoticeBanner code={query.notice} title={query.title} description={query.message} />

        <Card title="Contact info setup" description="Support information can be shared to one or more target portals and optionally to a partition.">
          <form action={createRecordAction.bind(null, 'contactInfo')}>
            <Stack gap={16}>
              <FormGrid>
                <Field label="Title (EN)" name="titleEn" required />
                <Field label="Title (ZH)" name="titleZh" />
                <Field label="Email" name="email" type="email" />
                <Field label="Phone" name="phone" />
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
              <TextAreaField label="Address (EN)" name="addressEn" rows={3} />
              <TextAreaField label="Address (ZH)" name="addressZh" rows={3} />

              <SubmitRow submitLabel="Create contact info" cancelHref="/contact" cancelLabel="Cancel" />
            </Stack>
          </form>
        </Card>
      </Stack>
    </EapShell>
  );
}

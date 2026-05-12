import { Card, EmptyState, KeyValueList, SplitGrid, Stack, StatusBadge } from '@event-portal/ui';
import { updateRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, BooleanButtonField, Field, FormGrid, NoticeBanner, SelectField, SubmitRow, TextAreaField } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { ErpPathSummary } from '../../../components/erp-path-summary';
import { getEform, getPartitions, getTemplates } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';

type PageProps = {
  params: Promise<{ documentId: string }>;
  searchParams?: Promise<NoticeQuery>;
};

function formatOptionalBoolean(value: boolean | undefined) {
  if (value === true) {
    return 'Yes';
  }

  if (value === false) {
    return 'No';
  }

  return '-';
}

export default async function Page({ params, searchParams }: PageProps) {
  const [{ documentId }, query] = await Promise.all([params, searchParams]);
  const [detail, partitionRows, templateRows] = await Promise.all([getEform(documentId), getPartitions(), getTemplates()]);

  if (!detail) {
    return (
      <EapShell title="E-Form Detail" subtitle="The requested e-form record could not be found.">
        <Stack>
          <ActionRow>
            <ActionLink href="/eforms" label="Back to E-Form Master" variant="secondary" />
          </ActionRow>
          <EmptyState title="E-form not found" description="Check the selected record id or create a new e-form record." />
        </Stack>
      </EapShell>
    );
  }

  const { eform } = detail;
  const hasCustomTemplateLayout = Boolean(eform.layoutSettings || eform.customCss);

  return (
    <EapShell title={eform.eformName} subtitle="Update ERP e-form metadata, publication windows, and template assignment from the detail page.">
      <Stack>
        <ActionRow>
          <ActionLink href="/eforms" label="Back to E-Form Master" variant="secondary" />
          <ActionLink href="/eforms/new" label="Create e-form" />
        </ActionRow>
        <NoticeBanner code={query?.notice} title={query?.title} description={query?.message} />

        <SplitGrid
          left={
            <Card title="E-form detail" description="The update form on this detail page covers the ERP e-form master record fields.">
              <form action={updateRecordAction.bind(null, 'eform', eform.documentId)}>
                <Stack gap={16}>
                  <FormGrid>
                    <Field label="E-form name" name="eformName" defaultValue={eform.eformName} required />
                    <Field label="E-form code" name="eformCode" defaultValue={eform.eformCode} required />
                    <SelectField
                      label="ERP URL type"
                      name="accessType"
                      defaultValue={eform.accessType}
                      options={[
                        { value: 'PUBLIC', label: 'Public · /eform/public/{uuid}' },
                        { value: 'PRIVATE', label: 'Private · /eform/private/{uuid}' },
                      ]}
                    />
                    <Field label="Company" name="companyName" defaultValue={eform.companyName} required />
                    <Field label="Location" name="location" defaultValue={eform.location} required />
                    <SelectField
                      label="Partition"
                      name="partitionDocumentId"
                      defaultValue={eform.partitionDocumentId}
                      options={partitionRows.map((item) => ({ value: item.documentId, label: `${item.code} · ${item.description}` }))}
                    />
                    <SelectField
                      label="Template"
                      name="templateDocumentId"
                      defaultValue={eform.templateDocumentId}
                      required
                      options={templateRows.map((item) => ({ value: item.documentId, label: `${item.name} · ${item.partitionCodes.join(', ') || 'No partitions'}` }))}
                    />
                    <SelectField
                      label="Status"
                      name="status"
                      defaultValue={eform.status}
                      options={['DRAFT', 'RELEASED', 'DISABLED', 'CLOSED'].map((item) => ({ value: item, label: item }))}
                    />
                    <Field label="Active start" name="eventStartDate" type="date" defaultValue={eform.eventStartDate} required />
                    <Field label="Active end" name="eventEndDate" type="date" defaultValue={eform.eventEndDate} required />
                    <BooleanButtonField
                      label="Show in event period"
                      name="showInEventPeriod"
                      defaultValue={eform.showInEventPeriod}
                      helperText="ERP shows this e-form during the active dates only when this is enabled."
                    />
                    <BooleanButtonField
                      label="Show in expired"
                      name="showInExpired"
                      defaultValue={eform.showInExpired}
                      helperText="ERP keeps this e-form visible after the active end date when this is enabled."
                    />
                  </FormGrid>

                  <TextAreaField label="Description" name="description" defaultValue={eform.description} rows={3} />
                  <TextAreaField label="Notes" name="notes" defaultValue={eform.notes} rows={3} />

                  <SubmitRow submitLabel="Update e-form" cancelHref="/eforms" cancelLabel="Back to list" />
                </Stack>
              </form>
            </Card>
          }
          right={
            <Card title="Publishing summary" description="Current e-form metadata and outbound access pointers.">
              <Stack gap={16}>
                <KeyValueList
                  items={[
                    { label: 'Document id', value: eform.documentId },
                    { label: 'Status', value: <StatusBadge value={eform.status} /> },
                    { label: 'Published to ERP', value: eform.publishedToPortals ? 'Yes' : 'No' },
                    { label: 'Partition', value: eform.partitionCode },
                    { label: 'ERP URL type', value: eform.accessType },
                    { label: 'Template layout', value: hasCustomTemplateLayout ? 'Custom' : 'Default' },
                    { label: 'Show in event period', value: formatOptionalBoolean(eform.showInEventPeriod) },
                    { label: 'Show in expired', value: formatOptionalBoolean(eform.showInExpired) },
                    { label: 'Public URL', value: <a href={eform.publicUrl}>{eform.publicUrl}</a> },
                    { label: 'QR payload', value: <ErpPathSummary url={eform.qrPayload} /> },
                  ]}
                />
              </Stack>
            </Card>
          }
        />
      </Stack>
    </EapShell>
  );
}

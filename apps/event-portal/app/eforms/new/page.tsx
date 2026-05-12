import { Card, Stack } from '@event-portal/ui';
import { createRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, BooleanButtonField, Field, FormGrid, NoticeBanner, SelectField, SubmitRow, TextAreaField } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import type { EformCreateDraft } from '../../../lib/eap-create-drafts';
import { readCreateDraft } from '../../../lib/eap-create-drafts';
import { getPartitions, getTemplates } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';

type PageProps = {
  searchParams?: Promise<NoticeQuery>;
};

function parseDraftBooleanValue(value: string | undefined) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const draft = query.notice === 'create-failed' ? await readCreateDraft<EformCreateDraft>('eform') : undefined;
  const [partitionRows, templateRows] = await Promise.all([getPartitions(), getTemplates()]);

  return (
    <EapShell title="Create E-Form" subtitle="Create an ERP e-form that uses the registration template without booking timeslots.">
      <Stack>
        <ActionRow>
          <ActionLink href="/eforms" label="Back to E-Form Master" variant="secondary" />
        </ActionRow>
        <NoticeBanner code={query.notice} title={query.title} description={query.message} />

        <Card title="E-form setup" description="Choose the registration template first. It controls the fields, layout mode, and CSS used by the ERP e-form.">
          <form action={createRecordAction.bind(null, 'eform')}>
            <Stack gap={16}>
              <FormGrid>
                <Field label="E-form name" name="eformName" defaultValue={draft?.eformName} required />
                <Field label="E-form code" name="eformCode" defaultValue={draft?.eformCode} required />
                <SelectField
                  label="ERP URL type"
                  name="accessType"
                  defaultValue={draft?.accessType ?? 'PUBLIC'}
                  options={[
                    { value: 'PUBLIC', label: 'Public · /eform/public/{uuid}' },
                    { value: 'PRIVATE', label: 'Private · /eform/private/{uuid}' },
                  ]}
                />
                <Field label="Company" name="companyName" defaultValue={draft?.companyName} required />
                <Field label="Location" name="location" defaultValue={draft?.location} required />
                <SelectField
                  label="Partition"
                  name="partitionDocumentId"
                  defaultValue={draft?.partitionDocumentId}
                  options={partitionRows.map((item) => ({ value: item.documentId, label: `${item.code} · ${item.description}` }))}
                />
                <SelectField
                  label="Template"
                  name="templateDocumentId"
                  defaultValue={draft?.templateDocumentId}
                  required
                  options={templateRows.map((item) => ({ value: item.documentId, label: `${item.name} · ${item.partitionCodes.join(', ') || 'No partitions'}` }))}
                />
                <SelectField
                  label="Status"
                  name="status"
                  defaultValue={draft?.status ?? 'DRAFT'}
                  options={['DRAFT', 'RELEASED', 'DISABLED', 'CLOSED'].map((item) => ({ value: item, label: item }))}
                />
                <Field label="Active start" name="eventStartDate" type="date" defaultValue={draft?.eventStartDate} required />
                <Field label="Active end" name="eventEndDate" type="date" defaultValue={draft?.eventEndDate} required />
                <BooleanButtonField
                  label="Show in event period"
                  name="showInEventPeriod"
                  defaultValue={parseDraftBooleanValue(draft?.showInEventPeriod)}
                  helperText="ERP shows this e-form during the active dates only when this is enabled."
                />
                <BooleanButtonField
                  label="Show in expired"
                  name="showInExpired"
                  defaultValue={parseDraftBooleanValue(draft?.showInExpired)}
                  helperText="ERP keeps this e-form visible after the active end date when this is enabled."
                />
              </FormGrid>

              <TextAreaField label="Description" name="description" defaultValue={draft?.description} rows={3} />
              <TextAreaField label="Notes" name="notes" defaultValue={draft?.notes} rows={3} />

              <SubmitRow submitLabel="Create e-form" cancelHref="/eforms" cancelLabel="Cancel" />
            </Stack>
          </form>
        </Card>
      </Stack>
    </EapShell>
  );
}

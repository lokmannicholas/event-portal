import { Card, SimpleTable, Stack } from '@event-portal/ui';
import { createRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, ChipMultiSelectField, Field, FormGrid, NoticeBanner, SubmitRow, TextAreaField } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { TemplateFormFieldsEditor } from '../../../components/template-form-fields-editor';
import type { TemplateCreateDraft } from '../../../lib/eap-create-drafts';
import { readCreateDraft } from '../../../lib/eap-create-drafts';
import { getMandatoryFieldLibrary, getPartitions } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';

type PageProps = {
  searchParams?: Promise<NoticeQuery>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const draft = query.notice === 'create-failed' ? await readCreateDraft<TemplateCreateDraft>('template') : undefined;
  const [partitionRows, mandatoryFields] = await Promise.all([getPartitions(), getMandatoryFieldLibrary()]);

  return (
    <EapShell title="Create Template" subtitle="Create a new event template record with reusable form fields and partition assignment.">
      <Stack>
        <ActionRow>
          <ActionLink href="/templates" label="Back to Template Master" variant="secondary" />
        </ActionRow>
        <NoticeBanner code={query.notice} title={query.title} description={query.message} />

        <Card title="Template setup" description="Templates now define reusable registration form fields and the partitions that can use them.">
          <form action={createRecordAction.bind(null, 'template')}>
            <Stack gap={16}>
              <FormGrid>
                <Field label="Template name" name="name" defaultValue={draft?.name} required />
              </FormGrid>

              <ChipMultiSelectField
                label="Partitions"
                name="partitionDocumentIds"
                defaultValue={draft?.partitionDocumentIds}
                helperText="A template can be linked to multiple partitions. Each partition can only be linked to one template."
                itemLabelSingular="partition"
                itemLabelPlural="partitions"
                options={partitionRows.map((item) => ({ value: item.documentId, label: `${item.code} · ${item.description}` }))}
              />

              <TextAreaField label="Template description" name="description" defaultValue={draft?.description} rows={3} />

              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ fontWeight: 700 }}>Registration form fields</div>
                <div style={{ color: '#5b677a', fontSize: '14px' }}>
                  Mandatory fields are locked from EAP and always shown in ERP. Add custom template fields below and use the checkbox to enable or disable them for ERP.
                </div>
                <TemplateFormFieldsEditor initialFields={mandatoryFields} initialFieldsJson={draft?.formFieldsJson} />
              </div>

              <SubmitRow submitLabel="Create template" cancelHref="/templates" cancelLabel="Cancel" />
            </Stack>
          </form>
        </Card>

        <Card title="Mandatory field library" description="These Strapi-managed mandatory fields are always included in the ERP registration form.">
          <SimpleTable
            columns={[
              { key: 'field', label: 'Field' },
              { key: 'type', label: 'Type' },
              { key: 'required', label: 'Required' },
            ]}
            rows={mandatoryFields.map((field) => ({
              field: field.labelEn,
              type: field.fieldType,
              required: field.required ? 'Yes' : 'No',
            }))}
          />
        </Card>
      </Stack>
    </EapShell>
  );
}

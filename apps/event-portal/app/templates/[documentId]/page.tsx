import { Card, EmptyState, KeyValueList, SimpleTable, SplitGrid, Stack } from '@event-portal/ui';
import { updateRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, Field, FormGrid, NoticeBanner, SubmitRow, TextAreaField } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { TemplateFormFieldsEditor } from '../../../components/template-form-fields-editor';
import { getMandatoryFieldLibrary, getTemplate } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';
import { mergeTemplateFields } from '../../../lib/template-form-fields';

type PageProps = {
  params: Promise<{ documentId: string }>;
  searchParams?: Promise<NoticeQuery>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const [{ documentId }, query] = await Promise.all([params, searchParams]);
  const [record, mandatoryFields] = await Promise.all([getTemplate(documentId), getMandatoryFieldLibrary()]);

  if (!record) {
    return (
      <EapShell title="Template Detail" subtitle="The requested template record could not be found.">
        <Stack>
          <ActionRow>
            <ActionLink href="/templates" label="Back to Template Master" variant="secondary" />
          </ActionRow>
          <EmptyState title="Template not found" description="Check the selected record id or create a new template record." />
        </Stack>
      </EapShell>
    );
  }

  const editableFields = mergeTemplateFields(mandatoryFields, record.fields);
  const hasCustomLayout = Boolean(record.layoutSettings || record.customCss);

  return (
    <EapShell title={record.name} subtitle="Update the reusable form fields and layout snapshot for this template.">
      <Stack>
        <ActionRow>
          <ActionLink href="/templates" label="Back to Template Master" variant="secondary" />
          <ActionLink href="/templates/new" label="Create template" />
          <ActionLink href={`/templates/${record.documentId}/layout`} label="Customize layout" />
        </ActionRow>
        <NoticeBanner code={query?.notice} title={query?.title} description={query?.message} />

        <SplitGrid
          left={
            <Card title="Template detail" description="This record controls the reusable field list used by registration forms.">
              <form action={updateRecordAction.bind(null, 'template', record.documentId)}>
                <Stack gap={16}>
                  <input type="hidden" name="layoutSettingsJson" value={record.layoutSettings ? JSON.stringify(record.layoutSettings) : ''} readOnly />
                  <input type="hidden" name="customCss" value={record.customCss ?? ''} readOnly />
                  <FormGrid>
                    <Field label="Template name" name="name" defaultValue={record.name} required />
                  </FormGrid>

                  <TextAreaField label="Template description" name="description" defaultValue={record.description} rows={3} />

                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ fontWeight: 700 }}>Registration form fields</div>
                    <div style={{ color: '#5b677a', fontSize: '14px' }}>
                      Mandatory fields are locked from EAP and always shown in ERP. Custom rows here are saved into the template `formFields` snapshot.
                    </div>
                    <TemplateFormFieldsEditor initialFields={editableFields} />
                  </div>

                  <SubmitRow submitLabel="Update template" cancelHref="/templates" cancelLabel="Back to list" />
                </Stack>
              </form>
            </Card>
          }
          right={
            <Card title="Template summary" description="This is the current template record snapshot.">
                <KeyValueList
                  items={[
                    { label: 'Document id', value: record.documentId },
                    { label: 'Fields', value: String(editableFields.length) },
                    { label: 'ERP layout', value: hasCustomLayout ? 'Custom' : 'Default' },
                  ]}
              />
            </Card>
          }
        />

        <Card title="Field configuration" description="The ERP registration form reads these field names and their order from this template snapshot.">
          <SimpleTable
            columns={[
              { key: 'field', label: 'Field' },
              { key: 'type', label: 'Type' },
              { key: 'visible', label: 'Portal visibility' },
            ]}
            rows={editableFields.map((field) => ({
              field: field.labelEn,
              type: field.fieldType,
              visible: [field.visibleInERP && 'ERP', field.visibleInECP && 'ECP', field.visibleInEAP && 'EAP'].filter(Boolean).join(', '),
            }))}
          />
        </Card>
      </Stack>
    </EapShell>
  );
}

import { ActionLink, ActionRow } from '../../components/admin-forms';
import { Card, KeyValueList, SimpleTable, SplitGrid, Stack } from '@event-portal/ui';
import { EapShell } from '../../components/eap-shell';
import { getTemplates } from '../../lib/api';

export default async function Page() {
  const data = await getTemplates();
  const primaryTemplate = data[0];

  return (
    <EapShell
      title="Event Template Master"
      subtitle="Reusable form blueprints that define registration fields and partition coverage for the registration experience."
    >
      <Stack>
        <ActionRow>
          <ActionLink href="/templates/new" label="Create template" />
        </ActionRow>

        <SplitGrid
          left={
            <Card title="Templates" description="Each template controls field selection and partition coverage for event registration forms. Open a record to view or update it.">
              <SimpleTable
                columns={[
                  { key: 'name', label: 'Template' },
                  { key: 'partitions', label: 'Partitions' },
                  { key: 'fields', label: 'Fields' },
                  { key: 'detail', label: 'Detail' },
                ]}
                rows={data.map((template) => ({
                  name: <a href={`/templates/${template.documentId}`}>{template.name}</a>,
                  partitions: template.partitionCodes.join(', ') || '-',
                  fields: String(template.fieldCount),
                  detail: <a href={`/templates/${template.documentId}`}>Open record</a>,
                }))}
              />
            </Card>
          }
          right={
            <Card title="Selected template detail" description="Sample field library and partition coverage from the first template.">
              {primaryTemplate ? (
                <Stack gap={14}>
                  <KeyValueList
                    items={[
                      { label: 'Template', value: primaryTemplate.name },
                      { label: 'Partitions', value: primaryTemplate.partitionCodes.join(', ') || '-' },
                      { label: 'Field count', value: primaryTemplate.fieldCount },
                    ]}
                  />

                  <SimpleTable
                    columns={[
                      { key: 'field', label: 'Field' },
                      { key: 'type', label: 'Type' },
                      { key: 'required', label: 'Required' },
                    ]}
                    rows={primaryTemplate.fields.map((field) => ({
                      field: field.labelEn,
                      type: field.fieldType,
                      required: field.required ? 'Yes' : 'No',
                    }))}
                  />

                </Stack>
              ) : null}
            </Card>
          }
        />
      </Stack>
    </EapShell>
  );
}

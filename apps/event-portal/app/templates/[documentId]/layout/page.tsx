import { Card, EmptyState, KeyValueList, SplitGrid, Stack } from '@event-portal/ui';
import { saveTemplateLayoutAction } from '../../../actions/eap-record-actions';
import { ActionLink, ActionRow, NoticeBanner, SubmitRow } from '../../../../components/admin-forms';
import { EapShell } from '../../../../components/eap-shell';
import { TemplateLayoutEditor } from '../../../../components/template-layout-editor';
import { getMandatoryFieldLibrary, getTemplate } from '../../../../lib/api';
import type { NoticeQuery } from '../../../../lib/eap-records';
import { mergeTemplateFields } from '../../../../lib/template-form-fields';

type PageProps = {
  params: Promise<{ documentId: string }>;
  searchParams?: Promise<NoticeQuery>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const [{ documentId }, query] = await Promise.all([params, searchParams]);
  const [record, mandatoryFields] = await Promise.all([getTemplate(documentId), getMandatoryFieldLibrary()]);

  if (!record) {
    return (
      <EapShell title="Template Layout" subtitle="The requested template record could not be found.">
        <Stack>
          <ActionRow>
            <ActionLink href="/templates" label="Back to Template Master" variant="secondary" />
          </ActionRow>
          <EmptyState title="Template not found" description="Check the selected record id or create a new template record first." />
        </Stack>
      </EapShell>
    );
  }

  const editableFields = mergeTemplateFields(mandatoryFields, record.fields);
  const visibleFieldCount = editableFields.filter((field) => field.visibleInERP).length;
  const hasCustomLayout = Boolean(record.layoutSettings || record.customCss);

  return (
    <EapShell title={`${record.name} Layout`} subtitle="Customize the ERP registration layout used by events that reference this template.">
      <Stack>
        <ActionRow>
          <ActionLink href={`/templates/${record.documentId}`} label="Back to template" variant="secondary" />
          <ActionLink href="/templates" label="Template Master" variant="secondary" />
        </ActionRow>
        <NoticeBanner code={query?.notice} title={query?.title} description={query?.message} />

        <SplitGrid
          left={
            <Card title="ERP layout builder" description="Drag fields between the left, right, and full-width lanes. If you save nothing custom, ERP keeps the default layout.">
              <form action={saveTemplateLayoutAction.bind(null, record.documentId)}>
                <Stack gap={16}>
                  <TemplateLayoutEditor
                    initialFields={editableFields}
                    initialLayoutSettings={record.layoutSettings}
                    initialCustomCss={record.customCss}
                  />
                  <SubmitRow submitLabel="Save layout" cancelHref={`/templates/${record.documentId}`} cancelLabel="Back to template" />
                </Stack>
              </form>
            </Card>
          }
          right={
            <Card title="Layout summary" description="This page only changes ERP presentation settings for the current template.">
              <KeyValueList
                items={[
                  { label: 'Template', value: record.name },
                  { label: 'Visible ERP fields', value: String(visibleFieldCount) },
                  { label: 'Current layout mode', value: hasCustomLayout ? 'Custom layout' : 'Default layout' },
                  { label: 'Custom CSS', value: record.customCss?.trim() ? 'Provided' : 'Not provided' },
                ]}
              />
            </Card>
          }
        />
      </Stack>
    </EapShell>
  );
}

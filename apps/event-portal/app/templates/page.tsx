import { ActionLink, ActionRow } from '../../components/admin-forms';
import { Card, KeyValueList, PaginationControls, SimpleTable, SplitGrid, Stack } from '@event-portal/ui';
import { EapShell } from '../../components/eap-shell';
import { getTemplates } from '../../lib/api';
import { getPortalText } from '../../lib/portal-language';
import { getPortalLanguageFromCookies } from '../../lib/portal-language.server';
import { paginateItems } from '../../lib/pagination';

type PageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const language = await getPortalLanguageFromCookies();
  const data = await getTemplates();
  const pagination = paginateItems(data, query);
  const primaryTemplate = pagination.items[0];
  const copy = {
    title: getPortalText(language, 'Event Template Master', '活動模板主檔'),
    subtitle: getPortalText(language, 'Reusable form blueprints that define registration fields and layout for the registration experience.', '定義登記欄位及版面設定的可重用表單藍圖。'),
    createTemplate: getPortalText(language, 'Create template', '建立模板'),
    cardTitle: getPortalText(language, 'Templates', '模板'),
    cardDescription: getPortalText(language, 'Each template controls field selection and layout for event registration forms. Open a record to view or update it.', '每個模板控制活動登記表單的欄位選擇及版面。開啟記錄以檢視或更新。'),
    template: getPortalText(language, 'Template', '模板'),
    fields: getPortalText(language, 'Fields', '欄位'),
    detail: getPortalText(language, 'Detail', '詳情'),
    openRecord: getPortalText(language, 'Open record', '開啟記錄'),
    itemLabel: getPortalText(language, 'templates', '模板'),
    selectedTemplate: getPortalText(language, 'Selected template detail', '已選模板詳情'),
    selectedTemplateDescription: getPortalText(language, 'Sample field library from the first template.', '從第一個模板顯示其欄位庫範例。'),
    fieldCount: getPortalText(language, 'Field count', '欄位數量'),
    field: getPortalText(language, 'Field', '欄位'),
    type: getPortalText(language, 'Type', '類型'),
    required: getPortalText(language, 'Required', '必填'),
    yes: getPortalText(language, 'Yes', '是'),
    no: getPortalText(language, 'No', '否'),
  };

  return (
    <EapShell
      title={copy.title}
      subtitle={copy.subtitle}
    >
      <Stack>
        <ActionRow>
          <ActionLink href="/templates/new" label={copy.createTemplate} />
        </ActionRow>

        <SplitGrid
          left={
            <Card title={copy.cardTitle} description={copy.cardDescription}>
              <SimpleTable
                columns={[
                  { key: 'name', label: copy.template },
                  { key: 'fields', label: copy.fields },
                  { key: 'detail', label: copy.detail },
                ]}
                rows={pagination.items.map((template) => ({
                  name: <a href={`/templates/${template.documentId}`}>{template.name}</a>,
                  fields: String(template.fieldCount),
                  detail: <a href={`/templates/${template.documentId}`}>{copy.openRecord}</a>,
                }))}
              />
              <PaginationControls basePath="/templates" searchParams={query} pagination={pagination} itemLabel={copy.itemLabel} language={language} />
            </Card>
          }
          right={
            <Card title={copy.selectedTemplate} description={copy.selectedTemplateDescription}>
              {primaryTemplate ? (
                <Stack gap={14}>
                  <KeyValueList
                    items={[
                      { label: copy.template, value: primaryTemplate.name },
                      { label: copy.fieldCount, value: primaryTemplate.fieldCount },
                    ]}
                  />

                  <SimpleTable
                    columns={[
                      { key: 'field', label: copy.field },
                      { key: 'type', label: copy.type },
                      { key: 'required', label: copy.required },
                    ]}
                    rows={primaryTemplate.fields.map((field) => ({
                      field: field.labelEn,
                      type: field.fieldType,
                      required: field.required ? copy.yes : copy.no,
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

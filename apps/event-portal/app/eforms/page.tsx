import { ActionLink, ActionRow } from '../../components/admin-forms';
import { Card, PaginationControls, SimpleTable, Stack, StatusBadge } from '@event-portal/ui';
import { EapShell } from '../../components/eap-shell';
import { getEforms } from '../../lib/api';
import { getPortalLanguageFromCookies } from '../../lib/portal-language.server';
import { getPortalText } from '../../lib/portal-language';
import { paginateItems } from '../../lib/pagination';

type PageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const language = await getPortalLanguageFromCookies();
  const data = await getEforms();
  const pagination = paginateItems(data, query);
  const copy = {
    title: getPortalText(language, 'E-Form Master', '電子表格主檔'),
    subtitle: getPortalText(language, 'Editable ERP e-forms that reuse template fields without booking timeslots.', '可編輯的 ERP 電子表格，重用模板欄位但不包含預約時段。'),
    createEform: getPortalText(language, 'Create e-form', '建立電子表格'),
    cardTitle: getPortalText(language, 'Generated e-forms', '已產生電子表格'),
    cardDescription: getPortalText(language, 'Use this screen for ERP forms that should publish with `/eform/public/{uuid}` or `/eform/private/{uuid}` and do not require booking settings.', '此畫面用於以 `/eform/public/{uuid}` 或 `/eform/private/{uuid}` 發佈、且不需要預約設定的 ERP 表格。'),
    eform: getPortalText(language, 'E-Form', '電子表格'),
    eformCode: getPortalText(language, 'E-Form Code', '電子表格代碼'),
    partition: getPortalText(language, 'Partition', '分區'),
    activeWindow: getPortalText(language, 'Active Window', '有效日期'),
    status: getPortalText(language, 'Status', '狀態'),
    publicUrl: getPortalText(language, 'Public URL', '公開網址'),
    detail: getPortalText(language, 'Detail', '詳情'),
    openRecord: getPortalText(language, 'Open record', '開啟記錄'),
    itemLabel: getPortalText(language, 'e-forms', '電子表格'),
  };

  return (
    <EapShell title={copy.title} subtitle={copy.subtitle}>
      <Stack>
        <ActionRow>
          <ActionLink href="/eforms/new" label={copy.createEform} />
        </ActionRow>

        <Card title={copy.cardTitle} description={copy.cardDescription}>
          <SimpleTable
            columns={[
              { key: 'eform', label: copy.eform },
              { key: 'eformCode', label: copy.eformCode },
              { key: 'partition', label: copy.partition },
              { key: 'activeWindow', label: copy.activeWindow },
              { key: 'status', label: copy.status },
              { key: 'publicUrl', label: copy.publicUrl },
              { key: 'detail', label: copy.detail },
            ]}
            rows={pagination.items.map((eform) => ({
              eform: (
                <div>
                  <div style={{ fontWeight: 700 }}>
                    <a href={`/eforms/${eform.documentId}`}>{eform.eformName}</a>
                  </div>
                  <div style={{ color: '#5b677a', fontSize: '13px' }}>{eform.companyName} · {eform.location}</div>
                </div>
              ),
              eformCode: eform.eformCode,
              partition: eform.partitionCode,
              activeWindow: `${eform.eventStartDate} → ${eform.eventEndDate}`,
              status: <StatusBadge value={eform.status} />,
              publicUrl: <a href={eform.publicUrl}>{eform.publicUrl}</a>,
              detail: <a href={`/eforms/${eform.documentId}`}>{copy.openRecord}</a>,
            }))}
          />
          <PaginationControls basePath="/eforms" searchParams={query} pagination={pagination} itemLabel={copy.itemLabel} language={language} />
        </Card>
      </Stack>
    </EapShell>
  );
}

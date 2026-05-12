import { Card, SimpleTable, Stack } from '@event-portal/ui';
import { EcpShell } from '../../../../components/ecp-shell';
import { getEcpDocuments } from '../../../../lib/ecp-api';
import { getPortalText } from '../../../../lib/portal-language';
import { getPortalLanguageFromCookies } from '../../../../lib/portal-language.server';

type PageProps = {
  params: Promise<{ groupCode: string }>;
};

export default async function Page({ params }: PageProps) {
  const { groupCode } = await params;
  const language = await getPortalLanguageFromCookies();
  const data = await getEcpDocuments(groupCode);
  const copy = {
    title: getPortalText(language, 'Useful Information & Promotion', '實用資訊及推廣'),
    subtitle: getPortalText(language, 'Group-scoped HR downloads published by EAP through Strapi content management.', '由 EAP 透過 Strapi 內容管理發佈、並按群組範圍提供 HR 下載的文件。'),
    cardTitle: getPortalText(language, 'Documents', '文件'),
    cardDescription: getPortalText(language, 'These files can be global or partition-scoped.', '這些文件可以是全域或按分區範圍發佈。'),
    titleLabel: getPortalText(language, 'Title', '標題'),
    file: getPortalText(language, 'File', '檔案'),
    scope: getPortalText(language, 'Partition Scope', '分區範圍'),
    download: getPortalText(language, 'Download', '下載'),
    all: getPortalText(language, 'All', '全部'),
    unavailable: getPortalText(language, 'Unavailable', '無法使用'),
  };

  return (
    <EcpShell
      title={copy.title}
      subtitle={copy.subtitle}
      groupCode={groupCode}
    >
      <Stack>
        <Card title={copy.cardTitle} description={copy.cardDescription}>
          <SimpleTable
            columns={[
              { key: 'title', label: copy.titleLabel },
              { key: 'file', label: copy.file },
              { key: 'scope', label: copy.scope },
              { key: 'download', label: copy.download },
            ]}
            rows={data.map((item) => ({
              title: item.titleEn,
              file: item.fileName,
              scope: item.partitionCode ?? copy.all,
              download: item.downloadUrl ? (
                <a
                  href={`/ecp/${encodeURIComponent(groupCode)}/documents/${encodeURIComponent(item.documentId)}/download`}
                  className="btn btn-outline-secondary"
                >
                  {copy.download}
                </a>
              ) : (
                copy.unavailable
              ),
            }))}
          />
        </Card>
      </Stack>
    </EcpShell>
  );
}

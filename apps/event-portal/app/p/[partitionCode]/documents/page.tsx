import { Card, SimpleTable, Stack } from '@event-portal/ui';
import { ErpShell } from '../../../../components/erp-shell';
import { getErpDocuments } from '../../../../lib/erp-api';
import { getErpLanguageFromSearchParams, getLocalizedText, type ErpLanguage } from '../../../../lib/erp-language';

type PageProps = {
  params: Promise<{ partitionCode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { partitionCode } = await params;
  const language = getErpLanguageFromSearchParams(await searchParams);
  const data = await getErpDocuments();
  const copy = getPageCopy(language);

  return (
    <ErpShell
      title={copy.title}
      subtitle={copy.subtitle}
      partitionCode={partitionCode}
      language={language}
    >
      <Stack>
        <Card title={copy.cardTitle} description={copy.cardDescription}>
          <SimpleTable
            columns={[
              { key: 'title', label: copy.titleColumn },
              { key: 'file', label: copy.fileColumn },
              { key: 'scope', label: copy.scopeColumn },
              { key: 'download', label: copy.downloadColumn },
            ]}
            rows={data.map((item) => ({
              title: getLocalizedText(language, item.titleEn, item.titleZh),
              file: item.fileName,
              scope: item.partitionCode ?? copy.allPartitions,
              download: item.downloadUrl ? (
                <a
                  href={`/p/${encodeURIComponent(partitionCode)}/documents/${encodeURIComponent(item.documentId)}/download`}
                  className="btn btn-outline-secondary"
                >
                  {copy.downloadAction}
                </a>
              ) : (
                copy.unavailable
              ),
            }))}
          />
        </Card>
      </Stack>
    </ErpShell>
  );
}

function getPageCopy(language: ErpLanguage) {
  if (language === 'zh-Hant') {
    return {
      title: '實用資訊及推廣',
      subtitle: '由 Strapi 設定的公開文件下載。',
      cardTitle: '文件',
      cardDescription: '當內容目標包括公開入口時，這些檔案會顯示於 ERP。',
      titleColumn: '標題',
      fileColumn: '檔案',
      scopeColumn: '適用分區',
      downloadColumn: '下載',
      allPartitions: '全部',
      downloadAction: '下載',
      unavailable: '不可用',
    };
  }

  return {
    title: 'Useful Information & Promotion',
    subtitle: 'Public document downloads configured in Strapi.',
    cardTitle: 'Documents',
    cardDescription: 'These files are visible in ERP when the content target includes the public portal.',
    titleColumn: 'Title',
    fileColumn: 'File',
    scopeColumn: 'Partition scope',
    downloadColumn: 'Download',
    allPartitions: 'All',
    downloadAction: 'Download',
    unavailable: 'Unavailable',
  };
}

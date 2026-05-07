import { Card, SimpleTable, Stack } from '@event-portal/ui';
import { EcpShell } from '../../../../components/ecp-shell';
import { getEcpDocuments } from '../../../../lib/ecp-api';

type PageProps = {
  params: Promise<{ groupCode: string }>;
};

export default async function Page({ params }: PageProps) {
  const { groupCode } = await params;
  const data = await getEcpDocuments(groupCode);

  return (
    <EcpShell
      title="Useful Information & Promotion"
      subtitle="Group-scoped HR downloads published by EAP through Strapi content management."
      groupCode={groupCode}
    >
      <Stack>
        <Card title="Documents" description="These files can be global or partition-scoped.">
          <SimpleTable
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'file', label: 'File' },
              { key: 'scope', label: 'Partition Scope' },
              { key: 'download', label: 'Download' },
            ]}
            rows={data.map((item) => ({
              title: item.titleEn,
              file: item.fileName,
              scope: item.partitionCode ?? 'All',
              download: item.downloadUrl ? (
                <a
                  href={`/ecp/${encodeURIComponent(groupCode)}/documents/${encodeURIComponent(item.documentId)}/download`}
                  className="btn btn-outline-secondary"
                >
                  Download
                </a>
              ) : (
                'Unavailable'
              ),
            }))}
          />
        </Card>
      </Stack>
    </EcpShell>
  );
}

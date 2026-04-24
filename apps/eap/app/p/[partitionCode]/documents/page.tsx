import { Card, SimpleTable, Stack } from '@flu-vax/ui';
import { ErpShell } from '../../../../components/erp-shell';
import { getErpDocuments } from '../../../../lib/erp-api';

type PageProps = {
  params: Promise<{ partitionCode: string }>;
};

export default async function Page({ params }: PageProps) {
  const { partitionCode } = await params;
  const data = await getErpDocuments();

  return (
    <ErpShell
      title="Useful Information & Promotion"
      subtitle="Public document downloads configured in Strapi."
      partitionCode={partitionCode}
    >
      <Stack>
        <Card title="Documents" description="These files are visible in ERP when the content target includes the public portal.">
          <SimpleTable
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'file', label: 'File' },
              { key: 'scope', label: 'Partition Scope' },
            ]}
            rows={data.map((item) => ({
              title: item.titleEn,
              file: item.fileName,
              scope: item.partitionCode ?? 'All',
            }))}
          />
        </Card>
      </Stack>
    </ErpShell>
  );
}

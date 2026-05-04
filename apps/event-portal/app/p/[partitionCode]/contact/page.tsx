import { Card, SimpleTable, Stack } from '@event-portal/ui';
import { ErpShell } from '../../../../components/erp-shell';
import { getErpContacts } from '../../../../lib/erp-api';

type PageProps = {
  params: Promise<{ partitionCode: string }>;
};

export default async function Page({ params }: PageProps) {
  const { partitionCode } = await params;
  const data = await getErpContacts();

  return (
    <ErpShell
      title="Contact Us"
      subtitle="Public support information managed in Strapi."
      partitionCode={partitionCode}
    >
      <Stack>
        <Card title="Support contacts" description="This content is shared across portals and can be filtered by partition if needed.">
          <SimpleTable
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'address', label: 'Address' },
            ]}
            rows={data.map((item) => ({
              title: item.titleEn,
              email: item.email ?? '-',
              phone: item.phone ?? '-',
              address: item.addressEn ?? '-',
            }))}
          />
        </Card>
      </Stack>
    </ErpShell>
  );
}

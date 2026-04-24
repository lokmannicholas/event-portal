import { Card, SimpleTable, Stack } from '@flu-vax/ui';
import { EcpShell } from '../../../../components/ecp-shell';
import { getEcpContacts } from '../../../../lib/ecp-api';

type PageProps = {
  params: Promise<{ groupCode: string }>;
};

export default async function Page({ params }: PageProps) {
  const { groupCode } = await params;
  const data = await getEcpContacts(groupCode);

  return (
    <EcpShell
      title="Contact Us"
      subtitle="Shared QHMS support information surfaced to the current client group."
      groupCode={groupCode}
    >
      <Stack>
        <Card title="Support contacts" description="Managed centrally in Strapi and filtered by portal target and linked partitions.">
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
    </EcpShell>
  );
}

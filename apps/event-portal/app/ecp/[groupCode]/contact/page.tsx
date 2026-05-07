import { Card, PaginationControls, SimpleTable, Stack } from '@event-portal/ui';
import { EcpShell } from '../../../../components/ecp-shell';
import { getEcpContacts } from '../../../../lib/ecp-api';
import { paginateItems } from '../../../../lib/pagination';

type PageProps = {
  params: Promise<{ groupCode: string }>;
  searchParams?: Promise<{ page?: string }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const [{ groupCode }, query] = await Promise.all([params, searchParams]);
  const data = await getEcpContacts(groupCode);
  const pagination = paginateItems(data, query ?? {});

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
            rows={pagination.items.map((item) => ({
              title: item.titleEn,
              email: item.email ?? '-',
              phone: item.phone ?? '-',
              address: item.addressEn ?? '-',
            }))}
          />
          <PaginationControls
            basePath={`/ecp/${groupCode}/contact`}
            searchParams={query ?? {}}
            pagination={pagination}
            itemLabel="contacts"
          />
        </Card>
      </Stack>
    </EcpShell>
  );
}

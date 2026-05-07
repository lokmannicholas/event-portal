import { Card, PaginationControls, SimpleTable, Stack } from '@event-portal/ui';
import { EcpShell } from '../../components/ecp-shell';
import { getGroups } from '../../lib/api';
import { paginateItems } from '../../lib/pagination';

type PageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const groups = await getGroups();
  const pagination = paginateItems(groups, query);

  return (
    <EcpShell
      title="Client portal entry"
      subtitle="Each client group has its own ECP entry path under `/ecp/{groupCode}`."
    >
      <Stack>
        <Card title="Available client groups" description="Open the group portal path after creating or assigning the user group in EAP.">
          <SimpleTable
            columns={[
              { key: 'groupCode', label: 'Group Code' },
              { key: 'description', label: 'Description' },
              { key: 'partitions', label: 'Partitions' },
              { key: 'path', label: 'Portal Path' },
            ]}
            rows={pagination.items.map((group) => ({
              groupCode: group.code,
              description: group.description,
              partitions: group.partitionCodes.join(', '),
              path: <a href={`/ecp/${group.code}`}>{`/ecp/${group.code}`}</a>,
            }))}
          />
          <PaginationControls basePath="/ecp" searchParams={query} pagination={pagination} itemLabel="groups" />
        </Card>
      </Stack>
    </EcpShell>
  );
}

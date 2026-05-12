import { ActionLink, ActionRow } from '../../components/admin-forms';
import { Card, PaginationControls, SimpleTable, Stack, StatusBadge } from '@event-portal/ui';
import { EapShell } from '../../components/eap-shell';
import { getPartitions } from '../../lib/api';
import { paginateItems } from '../../lib/pagination';

type PageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const data = await getPartitions();
  const pagination = paginateItems(data, query);

  return (
    <EapShell
      title="User Partition"
      subtitle="Partition codes define the public ERP scope and the event access scope shared by EAP and ECP."
    >
      <Stack>
        <ActionRow>
          <ActionLink href="/partitions/new" label="Create partition" />
        </ActionRow>

        <Card title="Partition list" description="Each event is assigned to one partition. The partition remains the ERP entry scope, while each event now gets its own `/e/public/{uuid}` or `/e/private/{uuid}` path. Open a partition to update it.">
          <SimpleTable
            columns={[
              { key: 'code', label: 'Partition Code' },
              { key: 'description', label: 'Description' },
              { key: 'erpPath', label: 'ERP Path' },
              { key: 'groups', label: 'Linked Groups' },
              { key: 'status', label: 'Status' },
              { key: 'detail', label: 'Detail' },
            ]}
            rows={pagination.items.map((item) => ({
              code: <a href={`/partitions/${item.documentId}`}>{item.code}</a>,
              description: item.description,
              erpPath: <a href={`/p/${item.code}`}>{`/p/${item.code}`}</a>,
              groups: item.userGroupCodes.join(', '),
              status: <StatusBadge value={item.status} />,
              detail: <a href={`/partitions/${item.documentId}`}>Open record</a>,
            }))}
          />
          <PaginationControls basePath="/partitions" searchParams={query} pagination={pagination} itemLabel="partitions" />
        </Card>
      </Stack>
    </EapShell>
  );
}

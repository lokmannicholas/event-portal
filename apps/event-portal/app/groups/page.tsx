import { ActionLink, ActionRow } from '../../components/admin-forms';
import { Card, PaginationControls, SimpleTable, Stack, StatusBadge } from '@event-portal/ui';
import { EapShell } from '../../components/eap-shell';
import { getGroups } from '../../lib/api';
import { paginateItems } from '../../lib/pagination';

type PageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const data = await getGroups();
  const pagination = paginateItems(data, query);

  return (
    <EapShell
      title="User Group"
      subtitle="Groups define client access scope, the ECP path, and which partitions assigned client users can see."
    >
      <Stack>
        <ActionRow>
          <ActionLink href="/groups/new" label="Create group" />
        </ActionRow>

        <Card title="Group list" description="Groups map client access scope and group-specific ECP access. Open a group to update it.">
          <SimpleTable
            columns={[
              { key: 'code', label: 'Group Code' },
              { key: 'description', label: 'Description' },
              { key: 'ecpPath', label: 'ECP Path' },
              { key: 'partitions', label: 'Partitions' },
              { key: 'users', label: 'Users' },
              { key: 'status', label: 'Status' },
              { key: 'detail', label: 'Detail' },
            ]}
            rows={pagination.items.map((group) => ({
              code: <a href={`/groups/${group.documentId}`}>{group.code}</a>,
              description: group.description,
              ecpPath: <a href={`/ecp/${group.code}`}>{`/ecp/${group.code}`}</a>,
              partitions: group.partitionCodes.join(', '),
              users: String(group.portalUsers?.length ?? 0),
              status: <StatusBadge value={group.status} />,
              detail: <a href={`/groups/${group.documentId}`}>Open record</a>,
            }))}
          />
          <PaginationControls basePath="/groups" searchParams={query} pagination={pagination} itemLabel="groups" />
        </Card>
      </Stack>
    </EapShell>
  );
}

import { ActionLink, ActionRow } from '../../components/admin-forms';
import { Card, SimpleTable, Stack, StatusBadge } from '@event-portal/ui';
import { EapShell } from '../../components/eap-shell';
import { getPartitions } from '../../lib/api';

export default async function Page() {
  const data = await getPartitions();

  return (
    <EapShell
      title="User Partition"
      subtitle="Partition codes define the public ERP scope and the event access scope shared by EAP and ECP."
    >
      <Stack>
        <ActionRow>
          <ActionLink href="/partitions/new" label="Create partition" />
        </ActionRow>

        <Card title="Partition list" description="Each event is assigned to one partition. The partition is the ERP entry scope, while each event gets its own `/e/{eventCode}` path under that partition. Open a partition to update it.">
          <SimpleTable
            columns={[
              { key: 'code', label: 'Partition Code' },
              { key: 'description', label: 'Description' },
              { key: 'erpPath', label: 'ERP Path' },
              { key: 'groups', label: 'Linked Groups' },
              { key: 'status', label: 'Status' },
              { key: 'detail', label: 'Detail' },
            ]}
            rows={data.map((item) => ({
              code: <a href={`/partitions/${item.documentId}`}>{item.code}</a>,
              description: item.description,
              erpPath: <a href={`/p/${item.code}`}>{`/p/${item.code}`}</a>,
              groups: item.userGroupCodes.join(', '),
              status: <StatusBadge value={item.status} />,
              detail: <a href={`/partitions/${item.documentId}`}>Open record</a>,
            }))}
          />
        </Card>
      </Stack>
    </EapShell>
  );
}

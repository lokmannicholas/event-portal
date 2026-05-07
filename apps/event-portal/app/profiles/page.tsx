import { ActionLink, ActionRow } from '../../components/admin-forms';
import { Card, PaginationControls, SimpleTable, Stack, StatusBadge } from '@event-portal/ui';
import { EapShell } from '../../components/eap-shell';
import { getUserAccounts } from '../../lib/api';
import { paginateItems } from '../../lib/pagination';

type PageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const data = await getUserAccounts();
  const pagination = paginateItems(data, query);

  return (
    <EapShell
      title="User Accounts"
      subtitle="User accounts track users-permissions users, portal role, status, last login time, and optional client groups."
    >
      <Stack>
        <ActionRow>
          <ActionLink href="/profiles/new" label="Create user" />
        </ActionRow>

        <Card title="Users" description="Disable a user account to block login. Password reset and invitation email flows are expected to be implemented through secure token links. Open a user to update it.">
          <SimpleTable
            columns={[
              { key: 'username', label: 'Username' },
              { key: 'email', label: 'Email' },
              { key: 'confirmed', label: 'Confirmed' },
              { key: 'group', label: 'Client Groups' },
              { key: 'role', label: 'Portal Role' },
              { key: 'status', label: 'Status' },
              { key: 'login', label: 'Last Login' },
              { key: 'detail', label: 'Detail' },
            ]}
            rows={pagination.items.map((user) => ({
              username: user.username,
              email: user.email,
              confirmed: user.confirmed === false ? 'No' : 'Yes',
              group: user.userGroupCodes.join(', ') || '-',
              role: user.portalRole,
              status: <StatusBadge value={user.status} />,
              login: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-GB') : '-',
              detail: <a href={`/profiles/${user.documentId}`}>Open record</a>,
            }))}
          />
          <PaginationControls basePath="/profiles" searchParams={query} pagination={pagination} itemLabel="users" />
        </Card>
      </Stack>
    </EapShell>
  );
}

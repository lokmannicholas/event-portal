import { ActionLink, ActionRow } from '../../components/admin-forms';
import { Card, SimpleTable, Stack, StatusBadge } from '@flu-vax/ui';
import { EapShell } from '../../components/eap-shell';
import { getUserAccounts } from '../../lib/api';

export default async function Page() {
  const data = await getUserAccounts();

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
            rows={data.map((user) => ({
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
        </Card>
      </Stack>
    </EapShell>
  );
}

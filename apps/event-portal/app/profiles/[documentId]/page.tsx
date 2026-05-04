import { Card, EmptyState, KeyValueList, SplitGrid, Stack, StatusBadge } from '@event-portal/ui';
import { updateRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, ChipMultiSelectField, Field, FormGrid, NoticeBanner, SelectField, SubmitRow } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { getGroups, getUserAccount } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';

type PageProps = {
  params: Promise<{ documentId: string }>;
  searchParams?: Promise<NoticeQuery>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const [{ documentId }, query] = await Promise.all([params, searchParams]);
  const [record, groupRows] = await Promise.all([getUserAccount(documentId), getGroups()]);
  const groupOptions = groupRows.map((item) => ({ value: item.documentId, label: `${item.code} · ${item.description}` }));

  if (!record) {
    return (
      <EapShell title="User Detail" subtitle="The requested users-permissions user could not be found.">
        <Stack>
          <ActionRow>
            <ActionLink href="/profiles" label="Back to User Accounts" variant="secondary" />
          </ActionRow>
          <EmptyState title="User not found" description="Check the selected record id or create a new user account." />
        </Stack>
      </EapShell>
    );
  }

  return (
    <EapShell title={record.username} subtitle="Update user status, role, and optional client group assignment from the detail page.">
      <Stack>
        <ActionRow>
          <ActionLink href="/profiles" label="Back to User Accounts" variant="secondary" />
          <ActionLink href="/profiles/new" label="Create user" />
        </ActionRow>
        <NoticeBanner code={query?.notice} title={query?.title} description={query?.message} />

        <SplitGrid
          left={
            <Card title="User detail" description="Update the users-permissions user record directly from this page. Admin users can access all groups and do not need linked groups.">
              <form action={updateRecordAction.bind(null, 'profile', record.documentId)}>
                <Stack gap={16}>
                  <FormGrid>
                    <Field label="Username" name="username" defaultValue={record.username} required />
                    <Field label="Email" name="email" type="email" defaultValue={record.email} required />
                    <Field label="New password" name="password" type="password" />
                    <SelectField
                      label="Portal role"
                      name="portalRole"
                      defaultValue={record.portalRole}
                      options={[
                        { value: 'ADMIN', label: 'ADMIN' },
                        { value: 'CLIENT_HR', label: 'CLIENT_HR' },
                      ]}
                    />
                    <SelectField
                      label="Status"
                      name="status"
                      defaultValue={record.status}
                      options={[
                        { value: 'ACTIVE', label: 'ACTIVE' },
                        { value: 'DISABLED', label: 'DISABLED' },
                      ]}
                    />
                    <SelectField
                      label="Confirmed"
                      name="confirmed"
                      defaultValue={record.confirmed === false ? 'false' : 'true'}
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No' },
                      ]}
                    />
                    <ChipMultiSelectField
                      label="Client user groups"
                      name="userGroupDocumentIds"
                      defaultValue={record.userGroupDocumentIds}
                      helperText="Select one or more groups for CLIENT_HR users. Leave this empty for admins or unassigned users."
                      itemLabelSingular="group"
                      itemLabelPlural="groups"
                      options={groupOptions}
                    />
                  </FormGrid>

                  <SubmitRow submitLabel="Update user" cancelHref="/profiles" cancelLabel="Back to list" />
                </Stack>
              </form>
            </Card>
          }
          right={
            <Card title="User summary" description="Current access status and last login data.">
              <KeyValueList
                items={[
                  { label: 'Status', value: <StatusBadge value={record.status} /> },
                  { label: 'Username', value: record.username },
                  { label: 'Confirmed', value: record.confirmed === false ? 'No' : 'Yes' },
                  { label: 'Provider', value: record.provider ?? '-' },
                  { label: 'Strapi role', value: record.roleName ?? record.roleType ?? '-' },
                  { label: 'Portal role', value: record.portalRole },
                  { label: 'Client groups', value: record.userGroupCodes.join(', ') || '-' },
                  { label: 'Last login', value: record.lastLoginAt ? new Date(record.lastLoginAt).toLocaleString('en-GB') : '-' },
                ]}
              />
            </Card>
          }
        />
      </Stack>
    </EapShell>
  );
}

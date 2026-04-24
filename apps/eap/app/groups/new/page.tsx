import { Card, Stack } from '@flu-vax/ui';
import { createRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, ChipMultiSelectField, Field, FileField, FormGrid, NoticeBanner, SelectField, SubmitRow, TextAreaField } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { GroupUserLinkField } from '../../../components/group-user-link-field';
import { getPartitions, getUserAccounts } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';

type PageProps = {
  searchParams?: Promise<NoticeQuery>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const [partitionRows, userRows] = await Promise.all([getPartitions(), getUserAccounts()]);
  const clientUserOptions = userRows
    .filter((user) => user.portalRole === 'CLIENT_HR')
    .map((user) => ({
      value: user.documentId,
      username: user.username,
      email: user.email,
      label: `${user.username} · ${user.email}`,
      searchText: `${user.username} ${user.email} ${user.userGroupCodes.join(' ')}`,
      helperText: user.userGroupCodes.length > 0 ? `Also linked to ${user.userGroupCodes.join(', ')}` : 'Unassigned',
    }));

  return (
    <EapShell title="Create Group" subtitle="Create a user group record that defines client partition visibility.">
      <Stack>
        <ActionRow>
          <ActionLink href="/groups" label="Back to User Group" variant="secondary" />
        </ActionRow>
        <NoticeBanner code={query.notice} title={query.title} description={query.message} />

        <Card title="Group setup" description="Select the partitions this client group owns and can access. Each partition can belong to only one group.">
          <form action={createRecordAction.bind(null, 'group')} encType="multipart/form-data">
            <Stack gap={16}>
              <FormGrid>
                <Field label="Group code" name="code" required />
                <Field label="Description" name="description" required />
                <Field label="Company name" name="companyName" />
                <SelectField
                  label="Status"
                  name="status"
                  defaultValue="ACTIVE"
                  options={[
                    { value: 'ACTIVE', label: 'ACTIVE' },
                    { value: 'DISABLED', label: 'DISABLED' },
                  ]}
                />
                <ChipMultiSelectField
                  label="Partitions"
                  name="partitionDocumentIds"
                  helperText="Click one or more partitions to link them to this group. Selecting a partition here reassigns it from any previous group."
                  itemLabelSingular="partition"
                  itemLabelPlural="partitions"
                  options={partitionRows.map((item) => ({ value: item.documentId, label: `${item.code} · ${item.description}` }))}
                />
                <GroupUserLinkField
                  label="Client users"
                  name="portalUserDocumentIds"
                  helperText="Search existing client users, or create a new one here and save the group to apply the link."
                  options={clientUserOptions}
                />
              </FormGrid>

              <FileField
                label="Logo"
                name="logo"
                accept="image/*"
                helperText="Optional image used as the ECP menu icon and login branding for this group."
              />
              <TextAreaField label="Remarks" name="remarks" rows={3} />

              <SubmitRow submitLabel="Create group" cancelHref="/groups" cancelLabel="Cancel" />
            </Stack>
          </form>
        </Card>
      </Stack>
    </EapShell>
  );
}

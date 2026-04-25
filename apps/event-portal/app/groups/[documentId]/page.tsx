import { Card, EmptyState, KeyValueList, SplitGrid, Stack, StatusBadge } from '@flu-vax/ui';
import { updateRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, ChipMultiSelectField, Field, FileField, FormGrid, NoticeBanner, SelectField, SubmitRow, TextAreaField } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { GroupUserLinkField } from '../../../components/group-user-link-field';
import { getGroup, getPartitions, getUserAccounts } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';
import { toAbsoluteStrapiMediaUrl } from '../../../lib/strapi-media';

type PageProps = {
  params: Promise<{ documentId: string }>;
  searchParams?: Promise<NoticeQuery>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const [{ documentId }, query] = await Promise.all([params, searchParams]);
  const [record, partitionRows, userRows] = await Promise.all([getGroup(documentId), getPartitions(), getUserAccounts()]);

  if (!record) {
    return (
      <EapShell title="Group Detail" subtitle="The requested group record could not be found.">
        <Stack>
          <ActionRow>
            <ActionLink href="/groups" label="Back to User Group" variant="secondary" />
          </ActionRow>
          <EmptyState title="Group not found" description="Check the selected record id or create a new user group." />
        </Stack>
      </EapShell>
    );
  }

  const clientUserOptions = userRows
    .filter((user) => user.portalRole === 'CLIENT_HR')
    .map((user) => ({
      value: user.documentId,
      username: user.username,
      email: user.email,
      label: `${user.username} · ${user.email}`,
      searchText: `${user.username} ${user.email} ${user.userGroupCodes.join(' ')}`,
      helperText:
        user.userGroupCodes.includes(record.code)
          ? user.userGroupCodes.length > 1
            ? `Already linked here and ${user.userGroupCodes.filter((code) => code !== record.code).join(', ')}`
            : 'Already linked to this group'
          : user.userGroupCodes.length > 0
            ? `Also linked to ${user.userGroupCodes.join(', ')}`
            : 'Unassigned',
    }));
  const logoUrl = toAbsoluteStrapiMediaUrl(record.logo?.url);

  return (
    <EapShell title={record.code} subtitle="Update group partition scope and operational remarks from the detail page.">
      <Stack>
        <ActionRow>
          <ActionLink href="/groups" label="Back to User Group" variant="secondary" />
          <ActionLink href="/groups/new" label="Create group" />
        </ActionRow>
        <NoticeBanner code={query?.notice} title={query?.title} description={query?.message} />

        <SplitGrid
          left={
            <Card title="Group detail" description="Update the record directly from this page.">
              <form action={updateRecordAction.bind(null, 'group', record.documentId)} encType="multipart/form-data">
                <Stack gap={16}>
                  <FormGrid>
                    <Field label="Group code" name="code" defaultValue={record.code} required />
                    <Field label="Description" name="description" defaultValue={record.description} required />
                    <Field label="Company name" name="companyName" defaultValue={record.companyName} />
                    <SelectField
                      label="Status"
                      name="status"
                      defaultValue={record.status}
                      options={[
                        { value: 'ACTIVE', label: 'ACTIVE' },
                        { value: 'DISABLED', label: 'DISABLED' },
                      ]}
                    />
                    <ChipMultiSelectField
                      label="Partitions"
                      name="partitionDocumentIds"
                      defaultValue={record.partitionDocumentIds}
                      helperText="Click to add or remove partitions linked to this group. A partition can only belong to one group at a time."
                      itemLabelSingular="partition"
                      itemLabelPlural="partitions"
                      options={partitionRows.map((item) => ({ value: item.documentId, label: `${item.code} · ${item.description}` }))}
                    />
                    <GroupUserLinkField
                      label="Client users"
                      name="portalUserDocumentIds"
                      defaultValue={record.portalUserDocumentIds}
                      helperText="Search existing client users, or create a new one here and save the group to update the assignments."
                      options={clientUserOptions}
                    />
                  </FormGrid>

                  <FileField
                    label="Logo"
                    name="logo"
                    accept="image/*"
                    helperText="Upload a replacement image for the ECP menu icon and login branding."
                  />
                  <TextAreaField label="Remarks" name="remarks" defaultValue={record.remarks} rows={3} />

                  <SubmitRow submitLabel="Update group" cancelHref="/groups" cancelLabel="Back to list" />
                </Stack>
              </form>
            </Card>
          }
          right={
            <Card title="Group summary" description="Current access scope and portal routing details.">
              <Stack gap={16}>
                <KeyValueList
                  items={[
                    { label: 'Status', value: <StatusBadge value={record.status} /> },
                    { label: 'Company', value: record.companyName || '-' },
                    { label: 'Partitions', value: record.partitionCodes.join(', ') || '-' },
                    { label: 'Linked users', value: record.portalUsers?.map((user) => user.username).join(', ') || '-' },
                    { label: 'ECP path', value: <a href={`/ecp/${record.code}`}>{`/ecp/${record.code}`}</a> },
                  ]}
                />
                {logoUrl ? (
                  <div className="portal-branding-preview">
                    <div className="portal-branding-logo">
                      <span className="portal-field-label">ECP logo</span>
                      <img src={logoUrl} alt={record.logo?.alternativeText ?? `${record.code} logo`} />
                    </div>
                  </div>
                ) : (
                  <div className="portal-empty-box">No ECP logo is currently configured for this group.</div>
                )}
              </Stack>
            </Card>
          }
        />
      </Stack>
    </EapShell>
  );
}

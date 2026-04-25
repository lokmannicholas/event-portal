import { Card, Stack } from '@flu-vax/ui';
import { createRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, ChipMultiSelectField, Field, FormGrid, NoticeBanner, SelectField, SubmitRow } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { getGroups } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';

type PageProps = {
  searchParams?: Promise<NoticeQuery>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const groupRows = await getGroups();
  const groupOptions = groupRows.map((item) => ({ value: item.documentId, label: `${item.code} · ${item.description}` }));

  return (
    <EapShell title="Create User" subtitle="Create a users-permissions user and assign its role and optional client groups.">
      <Stack>
        <ActionRow>
          <ActionLink href="/profiles" label="Back to User Accounts" variant="secondary" />
        </ActionRow>
        <NoticeBanner code={query.notice} title={query.title} description={query.message} />

        <Card title="User setup" description="Users define portal role, status, and optional client group assignment. Admin users can access all groups and do not need linked groups.">
          <form action={createRecordAction.bind(null, 'profile')}>
            <Stack gap={16}>
              <FormGrid>
                <Field label="Username" name="username" required />
                <Field label="Email" name="email" type="email" required />
                <Field label="Password" name="password" type="password" />
                <SelectField
                  label="Portal role"
                  name="portalRole"
                  defaultValue="CLIENT_HR"
                  options={[
                    { value: 'ADMIN', label: 'ADMIN' },
                    { value: 'CLIENT_HR', label: 'CLIENT_HR' },
                  ]}
                />
                <SelectField
                  label="Status"
                  name="status"
                  defaultValue="ACTIVE"
                  options={[
                    { value: 'ACTIVE', label: 'ACTIVE' },
                    { value: 'DISABLED', label: 'DISABLED' },
                  ]}
                />
                <SelectField
                  label="Confirmed"
                  name="confirmed"
                  defaultValue="true"
                  options={[
                    { value: 'true', label: 'Yes' },
                    { value: 'false', label: 'No' },
                  ]}
                />
                <ChipMultiSelectField
                  label="Client user groups"
                  name="userGroupDocumentIds"
                  helperText="Select one or more groups for CLIENT_HR users. Leave this empty for admins or unassigned users."
                  itemLabelSingular="group"
                  itemLabelPlural="groups"
                  options={groupOptions}
                />
              </FormGrid>

              <SubmitRow submitLabel="Create user" cancelHref="/profiles" cancelLabel="Cancel" />
            </Stack>
          </form>
        </Card>
      </Stack>
    </EapShell>
  );
}

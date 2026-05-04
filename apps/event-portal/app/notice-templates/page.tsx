import { ActionLink, ActionRow } from '../../components/admin-forms';
import { Card, KeyValueList, SimpleTable, SplitGrid, Stack, StatusBadge } from '@event-portal/ui';
import { EapShell } from '../../components/eap-shell';
import { getNoticeTemplates } from '../../lib/api';

export default async function Page() {
  const templates = await getNoticeTemplates();
  const primaryTemplate = templates[0];

  return (
    <EapShell
      title="Notice Template Master"
      subtitle="Reusable email and SMS templates used when delivering registration information to participants."
    >
      <Stack>
        <ActionRow>
          <ActionLink href="/notice-templates/new" label="Create notice template" />
        </ActionRow>

        <SplitGrid
          left={
            <Card title="Notice templates" description="Manage reusable notice bodies for email and SMS delivery.">
              <SimpleTable
                columns={[
                  { key: 'name', label: 'Template' },
                  { key: 'channel', label: 'Channel' },
                  { key: 'active', label: 'Active' },
                  { key: 'detail', label: 'Detail' },
                ]}
                rows={templates.map((template) => ({
                  name: <a href={`/notice-templates/${template.documentId}`}>{template.name}</a>,
                  channel: template.channel,
                  active: <StatusBadge value={template.active ? 'ACTIVE' : 'DISABLED'} />,
                  detail: <a href={`/notice-templates/${template.documentId}`}>Open record</a>,
                }))}
              />
            </Card>
          }
          right={
            <Card title="Selected template detail" description="Quick summary from the first template in the list.">
              {primaryTemplate ? (
                <KeyValueList
                  items={[
                    { label: 'Template', value: primaryTemplate.name },
                    { label: 'Channel', value: primaryTemplate.channel },
                    { label: 'Active', value: primaryTemplate.active ? 'Yes' : 'No' },
                    { label: 'Subject', value: primaryTemplate.subject || '-' },
                  ]}
                />
              ) : null}
            </Card>
          }
        />
      </Stack>
    </EapShell>
  );
}

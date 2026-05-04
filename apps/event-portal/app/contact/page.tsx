import { Card, SimpleTable, Stack } from '@event-portal/ui';
import { ActionLink, ActionRow, NoticeBanner } from '../../components/admin-forms';
import { EapShell } from '../../components/eap-shell';
import { getContacts } from '../../lib/api';
import type { NoticeQuery } from '../../lib/eap-records';

type PageProps = {
  searchParams?: Promise<NoticeQuery>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const data = await getContacts();

  return (
    <EapShell
      title="Contact Us"
      subtitle="Managed support information used by EAP, ECP, and ERP."
    >
      <Stack>
        <ActionRow>
          <ActionLink href="/contact/new" label="Create contact info" />
        </ActionRow>
        <NoticeBanner code={query.notice} title={query.title} description={query.message} />
        <Card title="Support contacts" description="This content is managed centrally in Strapi and exposed to each portal by target portal and optional partition scope.">
          <SimpleTable
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'targets', label: 'Portal Targets' },
              { key: 'detail', label: 'Detail' },
            ]}
            rows={data.map((item) => ({
              title: item.titleEn,
              email: item.email ?? '-',
              phone: item.phone ?? '-',
              targets: item.portalTargets.join(', '),
              detail: <a href={`/contact/${item.documentId}`}>Open record</a>,
            }))}
          />
        </Card>
      </Stack>
    </EapShell>
  );
}

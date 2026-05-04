import { Card, SimpleTable, Stack } from '@event-portal/ui';
import { ActionLink, ActionRow, NoticeBanner } from '../../components/admin-forms';
import { EapShell } from '../../components/eap-shell';
import { getDocuments } from '../../lib/api';
import type { NoticeQuery } from '../../lib/eap-records';

type PageProps = {
  searchParams?: Promise<NoticeQuery>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const data = await getDocuments();

  return (
    <EapShell
      title="Useful Information & Promotion"
      subtitle="Portal document publishing with portal-target visibility and optional partition scope."
    >
      <Stack>
        <ActionRow>
          <ActionLink href="/content/new" label="Create document" />
        </ActionRow>
        <NoticeBanner code={query.notice} title={query.title} description={query.message} />
        <Card title="Documents" description="Admin uploads can be scoped to one or more portals and optionally to one company partition.">
          <SimpleTable
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'file', label: 'File' },
              { key: 'targets', label: 'Portal Targets' },
              { key: 'partition', label: 'Partition Scope' },
              { key: 'detail', label: 'Detail' },
            ]}
            rows={data.map((item) => ({
              title: item.titleEn,
              file: item.fileName,
              targets: item.portalTargets.join(', '),
              partition: item.partitionCode ?? 'All',
              detail: <a href={`/content/${item.documentId}`}>Open record</a>,
            }))}
          />
        </Card>
      </Stack>
    </EapShell>
  );
}

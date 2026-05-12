import { Card, PaginationControls, SimpleTable, Stack } from '@event-portal/ui';
import { EcpShell } from '../../../../components/ecp-shell';
import { getEcpContacts } from '../../../../lib/ecp-api';
import { paginateItems } from '../../../../lib/pagination';
import { getPortalText } from '../../../../lib/portal-language';
import { getPortalLanguageFromCookies } from '../../../../lib/portal-language.server';

type PageProps = {
  params: Promise<{ groupCode: string }>;
  searchParams?: Promise<{ page?: string }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const [{ groupCode }, query] = await Promise.all([params, searchParams]);
  const language = await getPortalLanguageFromCookies();
  const data = await getEcpContacts(groupCode);
  const pagination = paginateItems(data, query ?? {});
  const copy = {
    title: getPortalText(language, 'Contact Us', '聯絡我們'),
    subtitle: getPortalText(language, 'Shared QHMS support information surfaced to the current client group.', '顯示給目前客戶群組的共用 QHMS 支援資訊。'),
    cardTitle: getPortalText(language, 'Support contacts', '支援聯絡資料'),
    cardDescription: getPortalText(language, 'Managed centrally in Strapi and filtered by portal target and linked partitions.', '由 Strapi 集中管理，並按入口目標及連結分區篩選。'),
    titleLabel: getPortalText(language, 'Title', '標題'),
    email: getPortalText(language, 'Email', '電郵'),
    phone: getPortalText(language, 'Phone', '電話'),
    address: getPortalText(language, 'Address', '地址'),
    itemLabel: getPortalText(language, 'contacts', '聯絡資料'),
  };

  return (
    <EcpShell
      title={copy.title}
      subtitle={copy.subtitle}
      groupCode={groupCode}
    >
      <Stack>
        <Card title={copy.cardTitle} description={copy.cardDescription}>
          <SimpleTable
            columns={[
              { key: 'title', label: copy.titleLabel },
              { key: 'email', label: copy.email },
              { key: 'phone', label: copy.phone },
              { key: 'address', label: copy.address },
            ]}
            rows={pagination.items.map((item) => ({
              title: item.titleEn,
              email: item.email ?? '-',
              phone: item.phone ?? '-',
              address: item.addressEn ?? '-',
            }))}
          />
          <PaginationControls
            basePath={`/ecp/${groupCode}/contact`}
            searchParams={query ?? {}}
            pagination={pagination}
            itemLabel={copy.itemLabel}
            language={language}
          />
        </Card>
      </Stack>
    </EcpShell>
  );
}

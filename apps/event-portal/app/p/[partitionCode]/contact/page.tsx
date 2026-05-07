import { Card, SimpleTable, Stack } from '@event-portal/ui';
import { ErpShell } from '../../../../components/erp-shell';
import { getErpContacts } from '../../../../lib/erp-api';
import { getErpLanguageFromSearchParams, getLocalizedText, type ErpLanguage } from '../../../../lib/erp-language';

type PageProps = {
  params: Promise<{ partitionCode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { partitionCode } = await params;
  const language = getErpLanguageFromSearchParams(await searchParams);
  const data = await getErpContacts();
  const copy = getPageCopy(language);

  return (
    <ErpShell
      title={copy.title}
      subtitle={copy.subtitle}
      partitionCode={partitionCode}
      language={language}
    >
      <Stack>
        <Card title={copy.cardTitle} description={copy.cardDescription}>
          <SimpleTable
            columns={[
              { key: 'title', label: copy.titleColumn },
              { key: 'email', label: copy.emailColumn },
              { key: 'phone', label: copy.phoneColumn },
              { key: 'address', label: copy.addressColumn },
            ]}
            rows={data.map((item) => ({
              title: getLocalizedText(language, item.titleEn, item.titleZh),
              email: item.email ?? '-',
              phone: item.phone ?? '-',
              address: getLocalizedText(language, item.addressEn, item.addressZh) || '-',
            }))}
          />
        </Card>
      </Stack>
    </ErpShell>
  );
}

function getPageCopy(language: ErpLanguage) {
  if (language === 'zh-Hant') {
    return {
      title: '聯絡我們',
      subtitle: '由 Strapi 管理的公開支援資訊。',
      cardTitle: '支援聯絡資料',
      cardDescription: '此內容可跨入口共用，並可按需要按分區篩選。',
      titleColumn: '標題',
      emailColumn: '電郵',
      phoneColumn: '電話',
      addressColumn: '地址',
    };
  }

  return {
    title: 'Contact Us',
    subtitle: 'Public support information managed in Strapi.',
    cardTitle: 'Support contacts',
    cardDescription: 'This content is shared across portals and can be filtered by partition if needed.',
    titleColumn: 'Title',
    emailColumn: 'Email',
    phoneColumn: 'Phone',
    addressColumn: 'Address',
  };
}

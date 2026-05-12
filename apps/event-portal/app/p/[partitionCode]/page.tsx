import { Card, EmptyState, SimpleTable, Stack, StatusBadge } from '@event-portal/ui';
import { ErpShell } from '../../../components/erp-shell';
import { getErpLanding } from '../../../lib/erp-api';
import {
  getErpLanguageFromSearchParams,
  getLocalizedEformName,
  getLocalizedCompanyName,
  getLocalizedEventName,
  getLocalizedEventStatus,
  getLocalizedLocation,
  type ErpLanguage,
  withErpLanguage,
} from '../../../lib/erp-language';
import { toAbsoluteStrapiMediaUrl } from '../../../lib/strapi-media';

type PageProps = {
  params: Promise<{ partitionCode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function hasResolvedMediaUrl<T extends { url?: string }>(value: T): value is T & { url: string } {
  return typeof value.url === 'string' && value.url.length > 0;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { partitionCode } = await params;
  const language = getErpLanguageFromSearchParams(await searchParams);
  const landing = await getErpLanding(partitionCode);
  const headerCaption =
    landing?.partition.groupCompanyName ??
    (landing?.events[0]
      ? getLocalizedCompanyName(landing.events[0], language)
      : landing?.eforms[0]
        ? getLocalizedCompanyName(landing.eforms[0], language)
        : undefined);
  const copy = getPageCopy(language);

  if (!landing || (landing.events.length === 0 && landing.eforms.length === 0)) {
    return (
      <ErpShell
        title={copy.title(partitionCode)}
        subtitle={copy.emptySubtitle}
        partitionCode={partitionCode}
        headerCaption={headerCaption}
        language={language}
      >
        <EmptyState
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        />
      </ErpShell>
    );
  }

  const logoUrl = toAbsoluteStrapiMediaUrl(landing.partition.logo?.url);
  const bannerUrls = landing.partition.banners
    .map((banner) => ({
      ...banner,
      url: toAbsoluteStrapiMediaUrl(banner.url),
    }))
    .filter(hasResolvedMediaUrl);

  return (
    <ErpShell
      title={copy.title(landing.partition.code)}
      subtitle={copy.subtitle}
      partitionCode={landing.partition.code}
      headerCaption={headerCaption}
      language={language}
    >
      <Stack>
        {logoUrl || bannerUrls.length > 0 ? (
          <Card title={copy.brandingTitle} description={copy.brandingDescription}>
            <div className="portal-branding-display">
              {logoUrl ? (
                <div className="portal-branding-logo">
                  <img src={logoUrl} alt={landing.partition.logo?.alternativeText ?? `${landing.partition.code} logo`} />
                </div>
              ) : null}
              {bannerUrls.length > 0 ? (
                <div className="portal-branding-banner-grid">
                  {bannerUrls.map((banner) => (
                    <img key={banner.documentId ?? banner.url} src={banner.url} alt={banner.alternativeText ?? banner.name} />
                  ))}
                </div>
              ) : null}
            </div>
          </Card>
        ) : null}

        <Card title={copy.eventListTitle} description={copy.eventListDescription}>
          <SimpleTable
            columns={[
              { key: 'event', label: copy.eventColumn },
              { key: 'location', label: copy.locationColumn },
              { key: 'window', label: copy.eventWindowColumn },
              { key: 'status', label: copy.statusColumn },
              { key: 'open', label: copy.openColumn },
            ]}
            rows={landing.events.map((event) => ({
              event: getLocalizedEventName(event, language),
              location: getLocalizedLocation(event, language),
              window: `${event.eventStartDate} → ${event.eventEndDate}`,
              status: <StatusBadge value={event.status} label={getLocalizedEventStatus(event.status, language)} />,
              open: <a href={withErpLanguage(event.publicUrl, language)}>{copy.registerAction}</a>,
            }))}
          />
        </Card>

        {landing.eforms.length > 0 ? (
          <Card title={copy.eformListTitle} description={copy.eformListDescription}>
            <SimpleTable
              columns={[
                { key: 'eform', label: copy.eformColumn },
                { key: 'location', label: copy.locationColumn },
                { key: 'window', label: copy.eventWindowColumn },
                { key: 'status', label: copy.statusColumn },
                { key: 'open', label: copy.openColumn },
              ]}
              rows={landing.eforms.map((eform) => ({
                eform: getLocalizedEformName(eform, language),
                location: getLocalizedLocation(eform, language),
                window: `${eform.eventStartDate} → ${eform.eventEndDate}`,
                status: <StatusBadge value={eform.status} label={getLocalizedEventStatus(eform.status, language)} />,
                open: <a href={withErpLanguage(eform.publicUrl, language)}>{copy.openEformAction}</a>,
              }))}
            />
          </Card>
        ) : null}
      </Stack>
    </ErpShell>
  );
}

function getPageCopy(language: ErpLanguage) {
  if (language === 'zh-Hant') {
    return {
      title: (partitionCode: string) => `${partitionCode} 活動`,
      subtitle: '此頁只顯示已連結至該分區，並符合報名期、活動期及過期展示規則的活動。',
      emptySubtitle: '所選分區目前沒有可供瀏覽的活動。',
      emptyTitle: '沒有可用活動',
      emptyDescription: '此分區目前沒有符合報名期、活動期或過期展示規則的可見活動。請檢查二維碼連結或聯絡 QHMS 支援。',
      brandingTitle: '公司品牌內容',
      brandingDescription: '此分區上載的品牌素材會顯示給 ERP 訪客。',
      eventListTitle: '活動列表',
      eventListDescription: '選擇活動以查看詳情、可用時段及登記表格。',
      eformListTitle: '電子表格列表',
      eformListDescription: '選擇電子表格以開啟不含預約時段的 ERP 表格。',
      eventColumn: '活動',
      eformColumn: '電子表格',
      locationColumn: '地點',
      eventWindowColumn: '活動日期',
      statusColumn: '狀態',
      openColumn: '開啟',
      registerAction: '登記',
      openEformAction: '填寫表格',
    };
  }

  return {
    title: (partitionCode: string) => `${partitionCode} events`,
    subtitle: 'Participants see only events linked to this partition and currently allowed by the registration, event-period, and expired display rules.',
    emptySubtitle: 'No accessible event could be found for the selected partition.',
    emptyTitle: 'No accessible event',
    emptyDescription: 'There is currently no event visible for this partition under the registration, event-period, and expired display rules. Check the QR code or contact QHMS support.',
    brandingTitle: 'Company branding',
    brandingDescription: 'Assets uploaded for this partition are displayed here for ERP visitors.',
    eventListTitle: 'Event list',
    eventListDescription: 'Choose an event to view its details, available slots, and registration form.',
    eformListTitle: 'E-form list',
    eformListDescription: 'Choose an e-form to open a registration form without booking timeslots.',
    eventColumn: 'Event',
    eformColumn: 'E-Form',
    locationColumn: 'Location',
    eventWindowColumn: 'Event window',
    statusColumn: 'Status',
    openColumn: 'Open',
    registerAction: 'Register',
    openEformAction: 'Open form',
  };
}

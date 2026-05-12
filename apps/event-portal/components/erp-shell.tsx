import type { ReactNode } from 'react';
import { InlineNotice, PortalShell } from '@event-portal/ui';
import { buildErpNav } from '../lib/erp-nav';
import { ERP_LANGUAGE_QUERY_PARAM, type ErpLanguage } from '../lib/erp-language';
import { getErpLanding } from '../lib/erp-api';
import { toAbsoluteStrapiMediaUrl } from '../lib/strapi-media';
import { PortalLanguageSwitcher } from '../lib/ui/portal-shell-client';

export async function ErpShell(props: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  partitionCode?: string;
  headerCaption?: string;
  language: ErpLanguage;
}) {
  const landing = props.partitionCode ? await getErpLanding(props.partitionCode) : undefined;
  const headerCaption = props.headerCaption ?? landing?.partition.groupCompanyName;
  const brandImageSrc = toAbsoluteStrapiMediaUrl(landing?.partition.logo?.url);
  const brandImageAlt = landing?.partition.logo?.alternativeText ?? (landing ? `${landing.partition.code} logo` : undefined);
  const isZh = props.language === 'zh-Hant';
  const copy = {
    portalName: isZh ? '活動登記入口（ERP）' : 'Event Registration Portal (ERP)',
    publicSectionLabel: isZh ? 'ERP 公開入口' : 'ERP Public Portal',
    publicNavAriaLabel: isZh ? '入口導覽' : 'Portal navigation',
    publicAccessTitle: isZh ? '公開存取' : 'Public access',
    publicAccessBody: isZh
      ? 'ERP 活動連結可設定為公開或私人路徑，例如 `/e/public/550e8400-e29b-41d4-a716-446655440000` 或 `/e/private/550e8400-e29b-41d4-a716-446655440000`。'
      : 'ERP event links can be configured as public or private paths, for example `/e/public/550e8400-e29b-41d4-a716-446655440000` or `/e/private/550e8400-e29b-41d4-a716-446655440000`.',
    languageSwitcherLabel: isZh ? '切換語言' : 'Change language',
  };

  return (
    <PortalShell
      portal={copy.portalName}
      portalKind="registration"
      title={props.title}
      subtitle={props.subtitle}
      nav={buildErpNav(props.partitionCode, props.language)}
      language={props.language}
      brandImageSrc={brandImageSrc}
      brandImageAlt={brandImageAlt}
      headerCaption={headerCaption}
      publicSectionLabel={copy.publicSectionLabel}
      publicNavAriaLabel={copy.publicNavAriaLabel}
      headerActions={
        <PortalLanguageSwitcher
          queryParamName={ERP_LANGUAGE_QUERY_PARAM}
          value={props.language}
          ariaLabel={copy.languageSwitcherLabel}
          options={[
            { value: 'en', label: 'EN' },
            { value: 'zh-Hant', label: '繁中' },
          ]}
        />
      }
      asideNote={
        <div className="portal-sidebar-stack">
          <InlineNotice title={copy.publicAccessTitle}>
            {copy.publicAccessBody}
          </InlineNotice>
        </div>
      }
    >
      {props.children}
    </PortalShell>
  );
}

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
      ? 'ERP 為公開分區入口。使用者可透過 `/p/HSBC-FLU` 進入，並於 `/p/HSBC-FLU/e/2026-flu-vaccination` 開啟活動。'
      : 'ERP is public and partition-based. Users enter through `/p/HSBC-FLU` and open events through `/p/HSBC-FLU/e/2026-flu-vaccination`.',
    languageSwitcherLabel: isZh ? '切換語言' : 'Change language',
  };

  return (
    <PortalShell
      portal={copy.portalName}
      portalKind="registration"
      title={props.title}
      subtitle={props.subtitle}
      nav={buildErpNav(props.partitionCode, props.language)}
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

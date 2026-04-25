import type { ReactNode } from 'react';
import { InlineNotice, PortalShell } from '@flu-vax/ui';
import { buildErpNav } from '../lib/erp-nav';
import { getErpLanding } from '../lib/erp-api';

export async function ErpShell(props: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  partitionCode?: string;
  headerCaption?: string;
}) {
  const landing = !props.headerCaption && props.partitionCode ? await getErpLanding(props.partitionCode) : undefined;
  const headerCaption = props.headerCaption ?? landing?.partition.groupCompanyName;

  return (
    <PortalShell
      portal="Event Registration Portal (ERP)"
      title={props.title}
      subtitle={props.subtitle}
      nav={buildErpNav(props.partitionCode)}
      headerCaption={headerCaption}
      asideNote={
        <div className="portal-sidebar-stack">
          <InlineNotice title="Public access">
            ERP is public and partition-based. Users enter through `/p/HSBC-FLU` and open events through `/p/HSBC-FLU/e/2026-flu-vaccination`.
          </InlineNotice>
        </div>
      }
    >
      {props.children}
    </PortalShell>
  );
}

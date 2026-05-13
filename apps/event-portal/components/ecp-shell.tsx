import type { ReactNode } from 'react';
import { PortalShell } from '@event-portal/ui';
import { changeEcpPasswordAction } from '../app/actions/portal-account-actions';
import { buildEcpNav } from '../lib/ecp-nav';
import { logoutEcpAction } from '../app/actions/ecp-auth-actions';
import { getGroupByCode } from '../lib/api';
import { requireEcpSession } from '../lib/ecp-auth';
import { getPortalText, PORTAL_LANGUAGE_QUERY_PARAM } from '../lib/portal-language';
import { getPortalLanguageFromCookies } from '../lib/portal-language.server';
import { toAbsoluteStrapiMediaUrl } from '../lib/strapi-media';
import { PortalLanguageSwitcher } from '../lib/ui/portal-shell-client';
import { PortalUserMenu } from '../lib/ui/portal-user-menu';
import { PortalPasswordResetDialog } from './portal-password-reset-dialog';

export async function EcpShell(props: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  groupCode?: string;
  requireAuth?: boolean;
  hideNav?: boolean;
  hideAside?: boolean;
}) {
  const session =
    props.requireAuth === false
      ? null
      : props.groupCode
        ? await requireEcpSession(props.groupCode)
        : null;
  const language = await getPortalLanguageFromCookies();
  const group = props.groupCode ? await getGroupByCode(props.groupCode) : undefined;
  const brandImageSrc = toAbsoluteStrapiMediaUrl(group?.logo?.url);
  const brandImageAlt = group ? group.logo?.alternativeText ?? `${group.code} logo` : undefined;
  const copy = {
    portal: getPortalText(language, 'Event Client Portal (ECP)', '客戶入口（ECP）'),
    workspace: getPortalText(language, 'Event Portal workspace', '活動入口工作區'),
    languageSwitcherLabel: getPortalText(language, 'Change language', '切換語言'),
    roleLabel: getPortalText(language, 'Portal role', '入口角色'),
    groupLabel: getPortalText(language, 'Group', '群組'),
    logout: getPortalText(language, 'Logout', '登出'),
  };

  return (
    <PortalShell
      portal={copy.portal}
      portalKind="client"
      title={props.title}
      subtitle={props.subtitle}
      nav={props.hideNav ? [] : buildEcpNav(props.groupCode, language)}
      brandImageSrc={brandImageSrc}
      brandImageAlt={brandImageAlt}
      headerCaption={group?.companyName || copy.workspace}
      hideAside={props.hideAside}
      language={language}
      headerActions={
        <PortalLanguageSwitcher
          queryParamName={PORTAL_LANGUAGE_QUERY_PARAM}
          value={language}
          ariaLabel={copy.languageSwitcherLabel}
          options={[
            { value: 'en', label: 'EN' },
            { value: 'zh-Hant', label: 'ZH' },
          ]}
        />
      }
      headerNote={
        session ? (
          <PortalUserMenu username={session.username} email={session.email} language={language}>
              <div className="portal-user-menu-item">{copy.roleLabel}: {session.portalRole}</div>
              <div className="portal-user-menu-item">{copy.groupLabel}: {session.groupCode}</div>
              <PortalPasswordResetDialog action={changeEcpPasswordAction} groupCode={session.groupCode} language={language} />
              <form action={logoutEcpAction}>
                <input type="hidden" name="groupCode" value={session.groupCode} />
                <button type="submit" className="btn btn-primary portal-block-button">
                  {copy.logout}
                </button>
              </form>
          </PortalUserMenu>
        ) : null
      }
    >
      {props.children}
    </PortalShell>
  );
}

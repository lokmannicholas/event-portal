import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { InlineNotice, PortalShell } from '@event-portal/ui';
import { changeEcpPasswordAction } from '../app/actions/portal-account-actions';
import { buildEcpNav } from '../lib/ecp-nav';
import { logoutEcpAction } from '../app/actions/ecp-auth-actions';
import { getGroupByCode } from '../lib/api';
import { requireEcpSession } from '../lib/ecp-auth';
import { PORTAL_LANGUAGE_COOKIE, PORTAL_LANGUAGE_QUERY_PARAM, parsePortalLanguage } from '../lib/portal-language';
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
  const cookieStore = await cookies();
  const language = parsePortalLanguage(cookieStore.get(PORTAL_LANGUAGE_COOKIE)?.value) ?? 'en';
  const group = props.groupCode ? await getGroupByCode(props.groupCode) : undefined;
  const brandImageSrc = toAbsoluteStrapiMediaUrl(group?.logo?.url);
  const brandImageAlt = group ? group.logo?.alternativeText ?? `${group.code} logo` : undefined;

  return (
    <PortalShell
      portal="Event Client Portal (ECP)"
      portalKind="client"
      title={props.title}
      subtitle={props.subtitle}
      nav={props.hideNav ? [] : buildEcpNav(props.groupCode, language)}
      brandImageSrc={brandImageSrc}
      brandImageAlt={brandImageAlt}
      headerCaption={group?.companyName || 'Event Portal workspace'}
      hideAside={props.hideAside}
      headerActions={
        <PortalLanguageSwitcher
          queryParamName={PORTAL_LANGUAGE_QUERY_PARAM}
          value={language}
          ariaLabel="Change language"
          options={[
            { value: 'en', label: 'EN' },
            { value: 'zh-Hant', label: 'ZH' },
          ]}
        />
      }
      headerNote={
        session ? (
          <PortalUserMenu username={session.username} email={session.email}>
              <div className="portal-user-menu-item">Portal role: {session.portalRole}</div>
              <div className="portal-user-menu-item">Group: {session.groupCode}</div>
              <PortalPasswordResetDialog action={changeEcpPasswordAction} groupCode={session.groupCode} />
              <form action={logoutEcpAction}>
                <input type="hidden" name="groupCode" value={session.groupCode} />
                <button type="submit" className="btn btn-primary portal-block-button">
                  Logout
                </button>
              </form>
          </PortalUserMenu>
        ) : null
      }
      asideNote={
        <div className="portal-sidebar-stack">
          <InlineNotice title="Client scope">
            This portal is group-scoped. Sign-in uses Strapi `users-permissions`, and access requires a user with `portalRole=CLIENT_HR` whose linked group code matches the `/ecp/HSBC-HR` style path.
          </InlineNotice>
        </div>
      }
    >
      {props.children}
    </PortalShell>
  );
}

import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { InlineNotice, PortalShell } from '@event-portal/ui';
import { changeEapPasswordAction } from '../app/actions/portal-account-actions';
import { logoutEapAction } from '../app/actions/eap-auth-actions';
import { requireEapSession } from '../lib/eap-auth';
import { buildEapNav } from '../lib/nav';
import { PORTAL_LANGUAGE_COOKIE, PORTAL_LANGUAGE_QUERY_PARAM, parsePortalLanguage } from '../lib/portal-language';
import { PortalLanguageSwitcher } from '../lib/ui/portal-shell-client';
import { PortalPasswordResetDialog } from './portal-password-reset-dialog';
import { PortalUserMenu } from '../lib/ui/portal-user-menu';

export async function EapShell(props: { title: string; subtitle?: string; children?: ReactNode; requireAuth?: boolean; hideNav?: boolean; hideAside?: boolean }) {
  const session = props.requireAuth === false ? null : await requireEapSession();
  const cookieStore = await cookies();
  const language = parsePortalLanguage(cookieStore.get(PORTAL_LANGUAGE_COOKIE)?.value) ?? 'en';

  return (
    <PortalShell
      portal="Event Admin Portal (EAP)"
      portalKind="admin"
      title={props.title}
      subtitle={props.subtitle}
      nav={props.hideNav ? [] : buildEapNav(language)}
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
              <PortalPasswordResetDialog action={changeEapPasswordAction} />
              <form action={logoutEapAction}>
                <button type="submit" className="btn btn-primary portal-block-button">
                  Logout
                </button>
              </form>
          </PortalUserMenu>
        ) : null
      }
      asideNote={
        <div className="portal-sidebar-stack">
          <InlineNotice title="Implementation note">
            EAP sign-in uses Strapi `users-permissions` accounts. Only active users with `portalRole=ADMIN` can open the admin routes.
          </InlineNotice>
        </div>
      }
    >
      {props.children}
    </PortalShell>
  );
}

import type { ReactNode } from 'react';
import { PortalShell } from '@event-portal/ui';
import { changeEapPasswordAction } from '../app/actions/portal-account-actions';
import { logoutEapAction } from '../app/actions/eap-auth-actions';
import { requireEapSession } from '../lib/eap-auth';
import { buildEapNav } from '../lib/nav';
import { getPortalText, PORTAL_LANGUAGE_QUERY_PARAM } from '../lib/portal-language';
import { getPortalLanguageFromCookies } from '../lib/portal-language.server';
import { PortalLanguageSwitcher } from '../lib/ui/portal-shell-client';
import { PortalPasswordResetDialog } from './portal-password-reset-dialog';
import { PortalUserMenu } from '../lib/ui/portal-user-menu';

export async function EapShell(props: { title: string; subtitle?: string; children?: ReactNode; requireAuth?: boolean; hideNav?: boolean; hideAside?: boolean }) {
  const session = props.requireAuth === false ? null : await requireEapSession();
  const language = await getPortalLanguageFromCookies();
  const copy = {
    portal: getPortalText(language, 'Event Admin Portal (EAP)', '活動管理入口（EAP）'),
    headerCaption: getPortalText(language, 'Event Portal workspace', '活動入口工作區'),
    languageSwitcherLabel: getPortalText(language, 'Change language', '切換語言'),
    roleLabel: getPortalText(language, 'Portal role', '入口角色'),
    logout: getPortalText(language, 'Logout', '登出'),
  };

  return (
    <PortalShell
      portal={copy.portal}
      portalKind="admin"
      title={props.title}
      subtitle={props.subtitle}
      nav={props.hideNav ? [] : buildEapNav(language)}
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
              <PortalPasswordResetDialog action={changeEapPasswordAction} language={language} />
              <form action={logoutEapAction}>
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

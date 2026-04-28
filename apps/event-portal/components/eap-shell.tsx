import type { ReactNode } from 'react';
import { InlineNotice, PortalShell } from '@flu-vax/ui';
import { changeEapPasswordAction } from '../app/actions/portal-account-actions';
import { logoutEapAction } from '../app/actions/eap-auth-actions';
import { requireEapSession } from '../lib/eap-auth';
import { eapNav } from '../lib/nav';
import { PortalPasswordResetDialog } from './portal-password-reset-dialog';
import { PortalUserMenu } from '../lib/ui/portal-user-menu';

export async function EapShell(props: { title: string; subtitle?: string; children?: ReactNode; requireAuth?: boolean; hideNav?: boolean; hideAside?: boolean }) {
  const session = props.requireAuth === false ? null : await requireEapSession();

  return (
    <PortalShell
      portal="Event Admin Portal (EAP)"
      portalKind="admin"
      title={props.title}
      subtitle={props.subtitle}
      nav={props.hideNav ? [] : eapNav}
      hideAside={props.hideAside}
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

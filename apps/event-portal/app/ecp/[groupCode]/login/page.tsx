import { Card, InlineNotice, Stack } from '@event-portal/ui';
import { loginEcpAction } from '../../../actions/ecp-auth-actions';
import { EcpShell } from '../../../../components/ecp-shell';

type PageProps = {
  params: Promise<{ groupCode: string }>;
  searchParams?: Promise<{ reason?: string }>;
};

function getReasonMessage(reason?: string) {
  switch (reason) {
    case 'auth-required':
      return 'Please sign in before opening this client portal.';
    case 'missing-credentials':
      return 'Enter both your email or username and password.';
    case 'invalid-credentials':
      return 'The submitted Strapi login credentials are invalid.';
    case 'access-denied':
      return 'Only active Strapi users with portalRole CLIENT_HR and a linked group code matching this URL can open this portal.';
    case 'logged-out':
      return 'You have been signed out.';
    default:
      return undefined;
  }
}

export default async function Page({ params, searchParams }: PageProps) {
  const [{ groupCode }, query] = await Promise.all([params, searchParams]);
  const message = getReasonMessage(query?.reason);

  return (
    <EcpShell
      title="Login"
      subtitle="Sign in with a Strapi users-permissions account set to CLIENT_HR and linked to this same group."
      groupCode={groupCode}
      requireAuth={false}
      hideNav
      hideAside
    >
      <Stack>
        {message ? <InlineNotice title="Access status">{message}</InlineNotice> : null}

        <Card title="Sign in" description="This login calls Strapi `auth/local` and only allows active users with `portalRole=CLIENT_HR` and a linked group code matching the current URL.">
          <form action={loginEcpAction} className="portal-form-stack portal-form-stack-compact">
            <input type="hidden" name="groupCode" value={groupCode} />
            <label className="portal-field">
              <div className="portal-field-label">Email or username</div>
              <input type="text" name="identifier" placeholder="hr.user@company.com" autoComplete="username" required />
            </label>
            <label className="portal-field">
              <div className="portal-field-label">Password</div>
              <input type="password" name="password" placeholder="••••••••" autoComplete="current-password" required />
            </label>
            <button type="submit" className="btn btn-primary">
              Sign in
            </button>
          </form>
        </Card>
      </Stack>
    </EcpShell>
  );
}

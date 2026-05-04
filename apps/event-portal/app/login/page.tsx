import { Card, InlineNotice, Stack } from '@event-portal/ui';
import { EapShell } from '../../components/eap-shell';
import { EapLoginForm } from './eap-login-form';

type PageProps = {
  searchParams?: Promise<{ reason?: string }>;
};

function getReasonMessage(reason?: string) {
  switch (reason) {
    case 'auth-required':
      return 'Please sign in before opening EAP.';
    case 'missing-credentials':
      return 'Enter both your email or username and password.';
    case 'invalid-credentials':
      return 'The submitted Strapi login credentials are invalid.';
    case 'access-denied':
      return 'Only active Strapi users with portalRole ADMIN can open EAP.';
    case 'logged-out':
      return 'You have been signed out.';
    default:
      return undefined;
  }
}

export default async function Page({ searchParams }: PageProps) {
  const query = await searchParams;

  const message = getReasonMessage(query?.reason);

  return (
    <EapShell
      title="Login"
      subtitle="Sign in with a Strapi users-permissions account configured with portalRole ADMIN before opening the admin portal."
      requireAuth={false}
      hideNav
      hideAside
    >
      <Stack>
        {message ? <InlineNotice title="Access status">{message}</InlineNotice> : null}

        <Card title="Sign in" description="This login calls Strapi `/api/auth/local` from the browser using `NEXT_PUBLIC_STRAPI_URL`, then establishes the EAP session only for active users whose `portalRole=ADMIN`.">
          <EapLoginForm initialMessage={message} />
        </Card>
      </Stack>
    </EapShell>
  );
}

import { Card, InlineNotice, Stack } from '@event-portal/ui';
import { EapShell } from '../../components/eap-shell';
import { EapLoginForm } from './eap-login-form';
import { getPortalText } from '../../lib/portal-language';
import { getPortalLanguageFromCookies } from '../../lib/portal-language.server';

type PageProps = {
  searchParams?: Promise<{ reason?: string }>;
};

function getReasonMessage(reason: string | undefined, language: 'en' | 'zh-Hant') {
  switch (reason) {
    case 'auth-required':
      return getPortalText(language, 'Please sign in before opening EAP.', '請先登入後再開啟 EAP。');
    case 'missing-credentials':
      return getPortalText(language, 'Enter both your email or username and password.', '請輸入你的電郵或用戶名稱，以及密碼。');
    case 'invalid-credentials':
      return getPortalText(language, 'The submitted Strapi login credentials are invalid.', '提交的 Strapi 登入資料無效。');
    case 'access-denied':
      return getPortalText(language, 'Only active Strapi users with portalRole ADMIN can open EAP.', '只有 portalRole 為 ADMIN 的啟用 Strapi 用戶可開啟 EAP。');
    case 'logged-out':
      return getPortalText(language, 'You have been signed out.', '你已登出。');
    default:
      return undefined;
  }
}

export default async function Page({ searchParams }: PageProps) {
  const query = await searchParams;
  const language = await getPortalLanguageFromCookies();
  const copy = {
    title: getPortalText(language, 'Login', '登入'),
    accessStatus: getPortalText(language, 'Access status', '存取狀態'),
    signIn: getPortalText(language, 'Sign in', '登入'),
  };

  const message = getReasonMessage(query?.reason, language);

  return (
    <EapShell
      title={copy.title}
      requireAuth={false}
      hideNav
      hideAside
    >
      <Stack>
        {message ? <InlineNotice title={copy.accessStatus}>{message}</InlineNotice> : null}

        <Card title={copy.signIn}>
          <EapLoginForm initialMessage={message} language={language} />
        </Card>
      </Stack>
    </EapShell>
  );
}

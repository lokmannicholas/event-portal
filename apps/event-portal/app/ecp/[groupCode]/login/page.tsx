import { Card, InlineNotice, Stack } from '@event-portal/ui';
import { loginEcpAction } from '../../../actions/ecp-auth-actions';
import { EcpShell } from '../../../../components/ecp-shell';
import { getPortalText } from '../../../../lib/portal-language';
import { getPortalLanguageFromCookies } from '../../../../lib/portal-language.server';

type PageProps = {
  params: Promise<{ groupCode: string }>;
  searchParams?: Promise<{ reason?: string }>;
};

function getReasonMessage(reason: string | undefined, language: 'en' | 'zh-Hant') {
  switch (reason) {
    case 'auth-required':
      return getPortalText(language, 'Please sign in before opening this client portal.', '請先登入後再開啟此客戶入口。');
    case 'missing-credentials':
      return getPortalText(language, 'Enter both your email or username and password.', '請輸入你的電郵或用戶名稱，以及密碼。');
    case 'invalid-credentials':
      return getPortalText(language, 'The submitted Strapi login credentials are invalid.', '提交的 Strapi 登入資料無效。');
    case 'access-denied':
      return getPortalText(language, 'Only active Strapi users with portalRole CLIENT_HR and a linked group code matching this URL can open this portal.', '只有 portalRole 為 CLIENT_HR 且其連結群組代碼與此網址相符的啟用 Strapi 用戶可開啟此入口。');
    case 'logged-out':
      return getPortalText(language, 'You have been signed out.', '你已登出。');
    default:
      return undefined;
  }
}

export default async function Page({ params, searchParams }: PageProps) {
  const [{ groupCode }, query] = await Promise.all([params, searchParams]);
  const language = await getPortalLanguageFromCookies();
  const copy = {
    title: getPortalText(language, 'Login', '登入'),
    accessStatus: getPortalText(language, 'Access status', '存取狀態'),
    signIn: getPortalText(language, 'Sign in', '登入'),
    identifier: getPortalText(language, 'Email or username', '電郵或用戶名稱'),
    password: getPortalText(language, 'Password', '密碼'),
  };
  const message = getReasonMessage(query?.reason, language);

  return (
    <EcpShell
      title={copy.title}
      groupCode={groupCode}
      requireAuth={false}
      hideNav
      hideAside
    >
      <Stack>
        {message ? <InlineNotice title={copy.accessStatus}>{message}</InlineNotice> : null}

        <Card title={copy.signIn}>
          <form action={loginEcpAction} className="portal-form-stack portal-form-stack-compact">
            <input type="hidden" name="groupCode" value={groupCode} />
            <label className="portal-field">
              <div className="portal-field-label">{copy.identifier}</div>
              <input type="text" name="identifier" placeholder="hr.user@company.com" autoComplete="username" required />
            </label>
            <label className="portal-field">
              <div className="portal-field-label">{copy.password}</div>
              <input type="password" name="password" placeholder="••••••••" autoComplete="current-password" required />
            </label>
            <button type="submit" className="btn btn-primary">
              {copy.signIn}
            </button>
          </form>
        </Card>
      </Stack>
    </EcpShell>
  );
}

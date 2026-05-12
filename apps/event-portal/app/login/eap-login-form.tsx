'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPortalText, type PortalLanguage } from '../../lib/portal-language';

type Props = {
  initialMessage?: string;
  language?: PortalLanguage;
};

type StrapiAuthSuccess = {
  jwt: string;
  user: {
    id?: number;
    documentId?: string;
    username?: string;
    email?: string;
  };
};

function getPublicStrapiUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

export function EapLoginForm({ initialMessage, language = 'en' }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState(initialMessage);
  const [pending, setPending] = useState(false);
  const copy = {
    missingCredentials: getPortalText(language, 'Enter both your email or username and password.', '請輸入你的電郵或用戶名稱，以及密碼。'),
    invalidCredentials: getPortalText(language, 'The submitted Strapi login credentials are invalid.', '提交的 Strapi 登入資料無效。'),
    accessDenied: getPortalText(language, 'Only active Strapi users with portalRole ADMIN can open EAP.', '只有 portalRole 為 ADMIN 的啟用 Strapi 用戶可開啟 EAP。'),
    sessionFailure: getPortalText(language, 'Unable to establish the EAP session after the Strapi login succeeded.', 'Strapi 登入成功後仍無法建立 EAP 工作階段。'),
    endpointFailure: getPortalText(language, 'Unable to reach the configured Strapi auth endpoint.', '無法連線到已設定的 Strapi 驗證端點。'),
    identifier: getPortalText(language, 'Email or username', '電郵或用戶名稱'),
    password: getPortalText(language, 'Password', '密碼'),
    signingIn: getPortalText(language, 'Signing in...', '登入中...'),
    signIn: getPortalText(language, 'Sign in', '登入'),
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get('identifier') ?? '').trim();
    const password = String(formData.get('password') ?? '').trim();

    if (!identifier || !password) {
      setMessage(copy.missingCredentials);
      return;
    }

    setPending(true);
    setMessage(undefined);

    try {
      const authResponse = await fetch(`${getPublicStrapiUrl()}/api/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier,
          password,
        }),
      });

      if (!authResponse.ok) {
        setMessage(copy.invalidCredentials);
        return;
      }

      const auth = (await authResponse.json()) as StrapiAuthSuccess;
      const sessionResponse = await fetch('/api/session/eap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jwt: auth.jwt,
          documentId: auth.user.documentId,
          id: auth.user.id,
          username: auth.user.username,
          email: auth.user.email,
        }),
      });

      if (sessionResponse.ok) {
        router.push('/');
        router.refresh();
        return;
      }

      const payload = (await sessionResponse.json().catch(() => null)) as { reason?: string } | null;

      if (payload?.reason === 'access-denied') {
        setMessage(copy.accessDenied);
        return;
      }

      setMessage(copy.sessionFailure);
    } catch {
      setMessage(copy.endpointFailure);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="portal-form-stack portal-form-stack-compact">
      <label className="portal-field">
        <div className="portal-field-label">{copy.identifier}</div>
        <input type="text" name="identifier" placeholder="admin@company.com" autoComplete="username" required disabled={pending} />
      </label>
      <label className="portal-field">
        <div className="portal-field-label">{copy.password}</div>
        <input type="password" name="password" placeholder="••••••••" autoComplete="current-password" required disabled={pending} />
      </label>
      {message ? <div className="portal-form-message">{message}</div> : null}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? copy.signingIn : copy.signIn}
      </button>
    </form>
  );
}

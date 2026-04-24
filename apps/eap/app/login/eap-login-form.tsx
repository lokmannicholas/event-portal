'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  initialMessage?: string;
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

export function EapLoginForm({ initialMessage }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState(initialMessage);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get('identifier') ?? '').trim();
    const password = String(formData.get('password') ?? '').trim();

    if (!identifier || !password) {
      setMessage('Enter both your email or username and password.');
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
        setMessage('The submitted Strapi login credentials are invalid.');
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
        setMessage('Only active Strapi users with portalRole ADMIN can open EAP.');
        return;
      }

      setMessage('Unable to establish the EAP session after the Strapi login succeeded.');
    } catch {
      setMessage('Unable to reach the configured Strapi auth endpoint.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="portal-form-stack portal-form-stack-compact">
      <label className="portal-field">
        <div className="portal-field-label">Email or username</div>
        <input type="text" name="identifier" placeholder="admin@company.com" required disabled={pending} />
      </label>
      <label className="portal-field">
        <div className="portal-field-label">Password</div>
        <input type="password" name="password" placeholder="••••••••" required disabled={pending} />
      </label>
      {message ? <div className="portal-form-message">{message}</div> : null}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}

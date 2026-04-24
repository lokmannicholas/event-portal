'use server';

import { redirect } from 'next/navigation';
import { authenticatePortalCredentials, canAccessAdminPortal } from '../../lib/portal-auth';
import { buildEapSession, clearEapSessionCookie, setEapSessionCookie } from '../../lib/eap-auth';

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export async function loginEapAction(formData: FormData) {
  const identifier = getValue(formData, 'identifier');
  const password = getValue(formData, 'password');

  if (!identifier || !password) {
    redirect('/login?reason=missing-credentials');
  }

  const auth = await authenticatePortalCredentials(identifier, password);

  if (!auth) {
    redirect('/login?reason=invalid-credentials');
  }

  const user = auth.user;

  if (!canAccessAdminPortal(user)) {
    redirect('/login?reason=access-denied');
  }

  await setEapSessionCookie(buildEapSession(user, auth.jwt));
  redirect('/');
}

export async function logoutEapAction() {
  await clearEapSessionCookie();
  redirect('/login?reason=logged-out');
}

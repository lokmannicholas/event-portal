'use server';

import { redirect } from 'next/navigation';
import { buildEcpSession, clearEcpSessionCookie, setEcpSessionCookie } from '../../lib/ecp-auth';
import { authenticatePortalCredentials, canAccessClientPortal } from '../../lib/portal-auth';

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export async function loginEcpAction(formData: FormData) {
  const groupCode = getValue(formData, 'groupCode');
  const identifier = getValue(formData, 'identifier');
  const password = getValue(formData, 'password');

  if (!groupCode || !identifier || !password) {
    redirect(`/ecp/${groupCode}/login?reason=missing-credentials`);
  }

  const auth = await authenticatePortalCredentials(identifier, password);

  if (!auth) {
    redirect(`/ecp/${groupCode}/login?reason=invalid-credentials`);
  }

  const user = auth.user;

  if (!canAccessClientPortal(user, groupCode)) {
    redirect(`/ecp/${groupCode}/login?reason=access-denied`);
  }

  await setEcpSessionCookie(buildEcpSession(user, auth.jwt, groupCode));
  redirect(`/ecp/${groupCode}`);
}

export async function logoutEcpAction(formData: FormData) {
  const groupCode = getValue(formData, 'groupCode');
  await clearEcpSessionCookie();
  redirect(groupCode ? `/ecp/${groupCode}/login?reason=logged-out` : '/ecp');
}

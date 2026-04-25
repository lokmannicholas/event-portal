'use server';

import { getEapSession } from '../../lib/eap-auth';
import { getEcpSession } from '../../lib/ecp-auth';
import { getStrapiBaseUrl } from '../../lib/strapi-base-url';

export type ChangePasswordState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function getErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const error = 'error' in payload ? payload.error : undefined;

  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  if ('message' in payload && typeof payload.message === 'string') {
    return payload.message;
  }

  return undefined;
}

async function changePassword(strapiJwt: string, currentPassword: string, nextPassword: string): Promise<ChangePasswordState> {
  if (!currentPassword || !nextPassword) {
    return {
      status: 'error',
      message: 'Enter both your old password and new password.',
    };
  }

  if (currentPassword === nextPassword) {
    return {
      status: 'error',
      message: 'Your new password must be different from your old password.',
    };
  }

  const response = await fetch(`${getStrapiBaseUrl()}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${strapiJwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      currentPassword,
      password: nextPassword,
      passwordConfirmation: nextPassword,
    }),
    cache: 'no-store',
    next: {
      revalidate: false,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);

    return {
      status: 'error',
      message: getErrorMessage(payload) ?? 'Failed to update password.',
    };
  }

  return {
    status: 'success',
    message: 'Password updated.',
  };
}

export async function changeEapPasswordAction(_: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const session = await getEapSession();

  if (!session) {
    return {
      status: 'error',
      message: 'Your session has expired. Please sign in again.',
    };
  }

  return changePassword(session.strapiJwt, getValue(formData, 'currentPassword'), getValue(formData, 'password'));
}

export async function changeEcpPasswordAction(_: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const groupCode = getValue(formData, 'groupCode');

  if (!groupCode) {
    return {
      status: 'error',
      message: 'Missing group context.',
    };
  }

  const session = await getEcpSession(groupCode);

  if (!session) {
    return {
      status: 'error',
      message: 'Your session has expired. Please sign in again.',
    };
  }

  return changePassword(session.strapiJwt, getValue(formData, 'currentPassword'), getValue(formData, 'password'));
}

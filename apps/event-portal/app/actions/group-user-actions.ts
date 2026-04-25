'use server';

import { revalidatePath } from 'next/cache';
import { StrapiRequestError, eventPortalSdk } from '../../lib/event-portal-sdk';

export type CreateInlineClientUserState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  user?: {
    documentId: string;
    username: string;
    email: string;
    status: 'ACTIVE' | 'DISABLED';
    portalRole: 'CLIENT_HR';
  };
};

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function getOptionalValue(formData: FormData, key: string) {
  const value = getValue(formData, key);
  return value || undefined;
}

function getErrorMessage(error: unknown) {
  if (error instanceof StrapiRequestError) {
    const body = error.body as
      | {
          error?: {
            message?: string;
          };
        }
      | undefined;

    return body?.error?.message || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to create the user right now.';
}

export async function createInlineClientUserAction(
  _previousState: CreateInlineClientUserState,
  formData: FormData,
): Promise<CreateInlineClientUserState> {
  try {
    const email = getValue(formData, 'email');
    const username = getValue(formData, 'username') || email;

    if (!email) {
      return {
        status: 'error',
        message: 'Email is required.',
      };
    }

    const response = await eventPortalSdk.users.create(
      {
        email,
        username,
        password: getOptionalValue(formData, 'password'),
        confirmed: getValue(formData, 'confirmed') !== 'false',
        blocked: getValue(formData, 'status') === 'DISABLED',
        portalRole: 'CLIENT_HR',
        userGroups: [],
      },
      {
        cache: 'no-store',
        revalidate: false,
      },
    );

    const user = response.data;

    revalidatePath('/profiles');
    revalidatePath('/groups');

    return {
      status: 'success',
      message: 'Client user created. Save the group to link this user.',
      user: {
        documentId: user.documentId,
        username: user.username ?? user.email,
        email: user.email,
        status: user.blocked ? 'DISABLED' : 'ACTIVE',
        portalRole: 'CLIENT_HR',
      },
    };
  } catch (error) {
    return {
      status: 'error',
      message: getErrorMessage(error),
    };
  }
}

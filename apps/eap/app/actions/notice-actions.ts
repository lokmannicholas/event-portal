'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getNoticeQueryString } from '../../lib/eap-records';
import { getStrapiBaseUrl } from '../../lib/strapi-base-url';
import { getServerStrapiRequestToken } from '../../lib/strapi-request-token';

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function getRelationValues(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function sendNoticeBatchAction(formData: FormData) {
  const token = await getServerStrapiRequestToken(true);
  const sendPath = '/notices/send';

  if (!token) {
    redirect(`${sendPath}${getNoticeQueryString('notices-send-failed')}`);
  }

  const payload = {
    eventDocumentId: getValue(formData, 'eventDocumentId') || undefined,
    noticeType: getValue(formData, 'noticeType') || undefined,
    appointmentDocumentIds: getRelationValues(formData, 'appointmentDocumentIds'),
    batchSize: Number(getValue(formData, 'batchSize') || 50),
  };

  const response = await fetch(`${getStrapiBaseUrl()}/api/portal/management/notices/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const parsed = (await response.json().catch(() => undefined)) as
    | {
        error?: {
          message?: string;
        };
        sentCount?: number;
        failedCount?: number;
        recipientCount?: number;
      }
    | undefined;

  if (!response.ok) {
    redirect(
      `${sendPath}${getNoticeQueryString('notices-send-failed', undefined, parsed?.error?.message || 'Failed to send notices.')}`,
    );
  }

  revalidatePath('/notices');
  revalidatePath('/appointments');
  revalidatePath('/events');

  redirect(
    `/notices${getNoticeQueryString(
      'notices-sent',
      undefined,
      `Processed ${parsed?.recipientCount ?? 0} recipients. Sent: ${parsed?.sentCount ?? 0}. Failed: ${parsed?.failedCount ?? 0}.`,
    )}`,
  );
}

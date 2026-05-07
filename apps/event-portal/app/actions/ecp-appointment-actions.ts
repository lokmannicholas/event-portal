'use server';

import { revalidatePath } from 'next/cache';
import { requireEcpSession } from '../../lib/ecp-auth';
import { getStrapiBaseUrl } from '../../lib/strapi-base-url';
import { getServerStrapiRequestToken } from '../../lib/strapi-request-token';

export type CancelEcpAppointmentInput = {
  groupCode: string;
  eventCode: string;
  appointmentDocumentId: string;
  reason?: string;
};

export type CancelEcpAppointmentResult = {
  appointmentDocumentId: string;
  status: 'CANCELLED' | 'FAILED';
  errorMessage?: string;
};

export async function cancelEcpAppointmentAction(input: CancelEcpAppointmentInput): Promise<CancelEcpAppointmentResult> {
  await requireEcpSession(input.groupCode);
  const token = await getServerStrapiRequestToken(true);

  if (!token) {
    return {
      appointmentDocumentId: input.appointmentDocumentId,
      status: 'FAILED',
      errorMessage: 'Not authenticated for appointment cancellation.',
    };
  }

  const response = await fetch(
    `${getStrapiBaseUrl()}/api/portal/ecp/appointments/${encodeURIComponent(input.appointmentDocumentId)}/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        groupCode: input.groupCode,
        reason: input.reason,
      }),
    },
  );

  const parsed = (await response.json().catch(() => undefined)) as
    | {
        error?: {
          message?: string;
        };
      }
    | undefined;

  revalidatePath(`/ecp/${input.groupCode}`);
  revalidatePath(`/ecp/${input.groupCode}/events`);
  revalidatePath(`/ecp/${input.groupCode}/events/${input.eventCode}`);

  if (!response.ok) {
    return {
      appointmentDocumentId: input.appointmentDocumentId,
      status: 'FAILED',
      errorMessage: parsed?.error?.message || 'Failed to cancel appointment.',
    };
  }

  return {
    appointmentDocumentId: input.appointmentDocumentId,
    status: 'CANCELLED',
  };
}

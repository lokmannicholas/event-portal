import crypto from 'crypto';

export function buildAppointmentIdentityHash(input: {
  eventDocumentId: string;
  participantName: string;
  staffNumber?: string | null;
}) {
  return crypto
    .createHash('sha256')
    .update([input.eventDocumentId, input.participantName.trim().toLowerCase(), input.staffNumber?.trim().toLowerCase() ?? ''].join('|'))
    .digest('hex');
}

export function createBookingReference() {
  return `BOOK-${Date.now()}`;
}

export function createHoldToken() {
  return crypto.randomUUID();
}

export function createCancelToken() {
  return crypto.randomUUID();
}

import type {
  AppointmentDTO,
  ContactInfoDTO,
  CreateEformSubmissionInput,
  CreateBookingInput,
  CreateHoldInput,
  EformDetailDTO,
  EnquiryInput,
  EnquiryResponseDTO,
  EventDetailDTO,
  HoldResponseDTO,
  PartitionLandingDTO,
  PortalDocumentDTO,
} from '@event-portal/contracts';
import { getStrapiBaseUrl } from './strapi-base-url';

const STRAPI_URL = getStrapiBaseUrl();

async function fetchCms<T>(path: string): Promise<T | undefined> {
  try {
    const response = await fetch(`${STRAPI_URL}${path}`, {
      next: { revalidate: 20 },
    });

    if (!response.ok) {
      throw new Error(`CMS request failed for ${path}`);
    }

    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

export async function getErpLanding(partitionCode: string): Promise<PartitionLandingDTO | undefined> {
  return fetchCms<PartitionLandingDTO>(`/api/portal/erp/partitions/${partitionCode}`);
}

export async function getErpEventDetail(eventIdentifier: string): Promise<EventDetailDTO | undefined> {
  return fetchCms<EventDetailDTO>(`/api/portal/erp/events/${encodeURIComponent(eventIdentifier)}`);
}

export async function getErpEformDetail(eformIdentifier: string): Promise<EformDetailDTO | undefined> {
  return fetchCms<EformDetailDTO>(`/api/portal/erp/eforms/${encodeURIComponent(eformIdentifier)}`);
}

export async function getErpDocuments(): Promise<PortalDocumentDTO[]> {
  return (await fetchCms<PortalDocumentDTO[]>('/api/portal/erp/documents')) ?? [];
}

export async function getErpContacts(): Promise<ContactInfoDTO[]> {
  return (await fetchCms<ContactInfoDTO[]>('/api/portal/erp/contacts')) ?? [];
}

export async function createErpHold(input: CreateHoldInput): Promise<HoldResponseDTO> {
  const response = await fetch(`${STRAPI_URL}/api/portal/erp/holds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to create hold');
  }

  return (await response.json()) as HoldResponseDTO;
}

export async function createErpBooking(input: CreateBookingInput): Promise<AppointmentDTO> {
  const response = await fetch(`${STRAPI_URL}/api/portal/erp/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to create booking');
  }

  return (await response.json()) as AppointmentDTO;
}

export async function createErpEformSubmission(input: CreateEformSubmissionInput) {
  const response = await fetch(`${STRAPI_URL}/api/portal/erp/eforms/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to submit e-form');
  }

  return response.json();
}

export async function sendErpEnquiry(input: EnquiryInput): Promise<EnquiryResponseDTO> {
  const response = await fetch(`${STRAPI_URL}/api/portal/erp/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to create enquiry');
  }

  return (await response.json()) as EnquiryResponseDTO;
}

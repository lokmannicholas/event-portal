import type {
  AppointmentDTO,
  ContactInfoDTO,
  CreateBookingInput,
  CreateHoldInput,
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

export async function getErpEventDetail(eventCode: string, partitionCode: string): Promise<EventDetailDTO | undefined> {
  return fetchCms<EventDetailDTO>(
    `/api/portal/erp/events/${encodeURIComponent(eventCode)}?partitionCode=${encodeURIComponent(partitionCode)}`,
  );
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

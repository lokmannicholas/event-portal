import type {
  AppointmentDTO,
  ContactInfoDTO,
  DashboardDTO,
  EventDetailDTO,
  EventListItemDTO,
  PortalDocumentDTO,
} from '@event-portal/contracts';
import { getServerStrapiRequestToken } from './strapi-request-token';
import { getStrapiBaseUrl } from './strapi-base-url';

const STRAPI_URL = getStrapiBaseUrl();

async function fetchCms<T>(path: string): Promise<T | undefined> {
  try {
    const token = await getServerStrapiRequestToken();
    if (!token) {
      return undefined;
    }

    const response = await fetch(`${STRAPI_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      throw new Error(`CMS request failed for ${path}`);
    }

    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

function getDefaultDashboard(groupCode: string): DashboardDTO {
  return {
    headline: 'ECP overview',
    stats: [
      { label: 'Visible events', value: '0', helper: groupCode || 'Client group' },
      { label: 'Confirmed bookings', value: '0', helper: 'Across visible events' },
      { label: 'Documents', value: '0', helper: 'Portal downloads' },
    ],
  };
}

export async function getEcpDashboard(groupCode: string): Promise<DashboardDTO> {
  return (await fetchCms<DashboardDTO>(`/api/portal/ecp/dashboard?groupCode=${encodeURIComponent(groupCode)}`)) ?? getDefaultDashboard(groupCode);
}

export async function getEcpEvents(groupCode: string): Promise<EventListItemDTO[]> {
  return (await fetchCms<EventListItemDTO[]>(`/api/portal/ecp/events?groupCode=${encodeURIComponent(groupCode)}`)) ?? [];
}

export async function getEcpEventDetail(eventCode: string, groupCode: string): Promise<EventDetailDTO | undefined> {
  return fetchCms<EventDetailDTO>(`/api/portal/ecp/events/${encodeURIComponent(eventCode)}?groupCode=${encodeURIComponent(groupCode)}`);
}

export async function getEcpAppointmentsForEvent(eventCode: string, groupCode: string): Promise<AppointmentDTO[]> {
  const detail = await getEcpEventDetail(eventCode, groupCode);
  if (!detail) {
    return [];
  }

  return (await fetchCms<AppointmentDTO[]>(
    `/api/portal/eap/appointments?eventDocumentId=${encodeURIComponent(detail.event.documentId)}`,
  )) ?? [];
}

export async function getEcpDocuments(groupCode: string): Promise<PortalDocumentDTO[]> {
  return (await fetchCms<PortalDocumentDTO[]>(`/api/portal/ecp/documents?groupCode=${encodeURIComponent(groupCode)}`)) ?? [];
}

export async function getEcpContacts(groupCode: string): Promise<ContactInfoDTO[]> {
  return (await fetchCms<ContactInfoDTO[]>(`/api/portal/ecp/contacts?groupCode=${encodeURIComponent(groupCode)}`)) ?? [];
}

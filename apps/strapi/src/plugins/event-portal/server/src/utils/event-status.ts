import type { Core } from '@strapi/strapi';

type EventLike = {
  eventStatus?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  publishedToPortals?: boolean;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function deriveEventStatus(event: EventLike, now = todayIso()) {
  if (event.eventStatus === 'DISABLED') {
    return 'DISABLED';
  }

  if (event.eventStatus === 'CLOSED') {
    return 'CLOSED';
  }

  if (event.eventEndDate && event.eventEndDate < now) {
    return 'CLOSED';
  }

  return event.publishedToPortals === true ? 'RELEASED' : 'DRAFT';
}

export async function syncEventStatusDocument(strapi: Core.Strapi, documentId: string) {
  const event = await strapi.documents('plugin::event-portal.event').findOne({
    documentId,
  });

  if (!event) {
    return null;
  }

  const nextStatus = deriveEventStatus(event as EventLike);

  if ((event as any).eventStatus !== nextStatus) {
    return strapi.documents('plugin::event-portal.event').update({
      documentId,
      data: {
        eventStatus: nextStatus,
      } as any,
    });
  }

  return event;
}

import { Core, factories } from '@strapi/strapi';

const uid = 'plugin::event-portal.event';

type RawEventSlotValue = {
  documentId?: string;
  eventDate?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  enabled?: boolean;
  quota?: number;
  usedCount?: number;
  holdCount?: number;
  sortOrder?: number;
};

type NormalizedEventSlotValue = {
  documentId: string | undefined;
  eventDate: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
  quota: number;
  usedCount: number;
  holdCount: number;
  sortOrder: number;
};

function normalizeTimeValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  if (/^\d{2}:\d{2}:\d{2}\.\d{3}$/.test(trimmed)) {
    return trimmed.slice(0, 8);
  }

  return trimmed;
}

export default factories.createCoreService(uid, ({ strapi }: { strapi: Core.Strapi }) => ({
  normalizeEventSlots(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    const normalized = value
      .filter((entry): entry is RawEventSlotValue => Boolean(entry) && typeof entry === 'object')
      .map((slot) => ({
        documentId: typeof slot.documentId === 'string' && slot.documentId.trim() ? slot.documentId.trim() : undefined,
        eventDate:
          typeof slot.eventDate === 'string'
            ? slot.eventDate.trim()
            : typeof slot.date === 'string'
              ? slot.date.trim()
              : '',
        startTime: typeof slot.startTime === 'string' ? normalizeTimeValue(slot.startTime) : '',
        endTime: typeof slot.endTime === 'string' ? normalizeTimeValue(slot.endTime) : '',
        enabled: slot.enabled !== false,
        quota: Number(slot.quota ?? 0),
        usedCount: Number(slot.usedCount ?? 0),
        holdCount: Number(slot.holdCount ?? 0),
        sortOrder: Number(slot.sortOrder ?? 0),
      }))
      .filter(
        (slot): slot is NormalizedEventSlotValue =>
          Boolean(slot.eventDate) &&
          Boolean(slot.startTime) &&
          Boolean(slot.endTime) &&
          Number.isFinite(slot.quota) &&
          slot.quota >= 0 &&
          Number.isFinite(slot.usedCount) &&
          slot.usedCount >= 0 &&
          Number.isFinite(slot.holdCount) &&
          slot.holdCount >= 0,
      );

    const sorted = normalized.slice().sort((left, right) => {
      const dateCompare = left.eventDate.localeCompare(right.eventDate);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      const startCompare = left.startTime.localeCompare(right.startTime);

      if (startCompare !== 0) {
        return startCompare;
      }

      return left.endTime.localeCompare(right.endTime);
    });

    let currentDate = '';
    let sortOrder = 10;

    return sorted.map((slot) => {
      if (slot.eventDate !== currentDate) {
        currentDate = slot.eventDate;
        sortOrder = 10;
      }

      const nextSlot = {
        ...slot,
        sortOrder: slot.sortOrder > 0 ? slot.sortOrder : sortOrder,
      };

      sortOrder += 10;
      return nextSlot;
    });
  },

  async syncEventSlots(documentId: string, rawEventSlots: unknown) {
    const event = await strapi.documents(uid).findOne({
      documentId,
      populate: {
        slots: true,
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const eventSlots = (this as any).normalizeEventSlots(rawEventSlots) as NormalizedEventSlotValue[];
    const existingSlots = Array.isArray((event as any).slots) ? ((event as any).slots as Array<{ documentId?: string }>) : [];
    const nextDocumentIds = new Set(eventSlots.map((slot) => slot.documentId).filter(Boolean));

    for (const existingSlot of existingSlots) {
      if (typeof existingSlot.documentId === 'string' && existingSlot.documentId && !nextDocumentIds.has(existingSlot.documentId)) {
        await strapi.documents('plugin::event-portal.event-slot').delete({
          documentId: existingSlot.documentId,
        });
      }
    }

    for (const slot of eventSlots) {
      const data = {
        event: documentId,
        eventDate: slot.eventDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        enabled: slot.enabled,
        quota: slot.quota,
        usedCount: slot.usedCount,
        holdCount: slot.holdCount,
        sortOrder: slot.sortOrder,
      };

      if (slot.documentId) {
        await strapi.documents('plugin::event-portal.event-slot').update({
          documentId: slot.documentId,
          data: data as any,
        });
        continue;
      }

      await strapi.documents('plugin::event-portal.event-slot').create({
        data: data as any,
      });
    }
  },
}));

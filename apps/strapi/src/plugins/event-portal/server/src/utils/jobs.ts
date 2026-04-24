import type { Core } from '@strapi/strapi';
import { syncEventStatusDocument } from './event-status';
import { sendNotification } from './notifier';

export async function expireActiveHolds(strapi: Core.Strapi) {
  const holds = await strapi.documents('plugin::event-portal.appointment-hold').findMany({
    filters: {
      appointmentHoldStatus: 'ACTIVE',
    },
    populate: {
      eventSlot: true,
    },
    limit: 100,
  });

  const now = new Date();

  for (const hold of holds as any[]) {
    if (!hold.expiresAt || new Date(hold.expiresAt) > now) {
      continue;
    }

    await strapi.documents('plugin::event-portal.appointment-hold').update({
      documentId: hold.documentId,
      data: {
        appointmentHoldStatus: 'EXPIRED',
      } as any,
    });

    if (hold.eventSlot?.documentId) {
      await strapi.documents('plugin::event-portal.event-slot').update({
        documentId: hold.eventSlot.documentId,
        data: {
          holdCount: Math.max((hold.eventSlot.holdCount ?? 1) - 1, 0),
        } as any,
      });
    }
  }
}

export async function syncEventStatuses(strapi: Core.Strapi) {
  const events = await strapi.documents('plugin::event-portal.event').findMany({
    limit: 200,
  });

  for (const event of events as any[]) {
    await syncEventStatusDocument(strapi, event.documentId);
  }
}

export async function sendUpcomingReminders(strapi: Core.Strapi) {
  const appointments = await strapi.documents('plugin::event-portal.appointment').findMany({
    filters: {
      appointmentStatus: 'CONFIRMED',
    },
    populate: {
      event: true,
    },
    limit: 200,
  });

  const today = new Date().toISOString().slice(0, 10);

  for (const appointment of appointments as any[]) {
    const offset = appointment.event?.reminderOffsetDays ?? 2;

    if (!appointment.appointmentDate) {
      continue;
    }

    const reminderDate = new Date(`${appointment.appointmentDate}T00:00:00Z`);
    reminderDate.setUTCDate(reminderDate.getUTCDate() - offset);

    if (reminderDate.toISOString().slice(0, 10) !== today) {
      continue;
    }

    const to =
      appointment.communicationPreference === 'SMS'
        ? appointment.mobileNumber
        : appointment.registeredEmail;

    if (!to) {
      continue;
    }

    await sendNotification(strapi, {
      channel: appointment.communicationPreference === 'SMS' ? 'SMS' : 'EMAIL',
      to,
      subject: 'Upcoming vaccination appointment',
      body: `Reminder: ${appointment.event?.eventName ?? 'Vaccination event'} on ${appointment.appointmentDate} at ${appointment.appointmentStartTime}.`,
    });
  }
}

import type { Core } from '@strapi/strapi';

export async function sendNotification(
  strapi: Core.Strapi,
  input: {
    channel: 'EMAIL' | 'SMS';
    to: string;
    subject?: string;
    body: string;
    htmlBody?: string;
  },
) {
  strapi.log.info(
    `[notify:${input.channel}] to=${input.to} subject=${input.subject ?? '(none)'} html=${input.htmlBody ? 'yes' : 'no'}`,
  );
  // TODO: integrate real email / SMS providers
  return input;
}

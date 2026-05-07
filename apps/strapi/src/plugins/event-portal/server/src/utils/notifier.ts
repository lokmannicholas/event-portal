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
  if (input.channel === 'EMAIL') {
    return strapi.plugin('sendgrid-email').service('mailer').sendEmail({
      to: input.to,
      subject: input.subject,
      body: input.body,
      htmlBody: input.htmlBody,
    });
  }

  return strapi.plugin('sms-sender').service('sender').sendSms({
    to: input.to,
    body: input.body,
  });
}

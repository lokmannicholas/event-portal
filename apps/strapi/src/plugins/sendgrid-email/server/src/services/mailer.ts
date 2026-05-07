import type { Core } from '@strapi/strapi';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeErrorMessage(status: number, payload: unknown) {
  if (payload && typeof payload === 'object' && Array.isArray((payload as any).errors)) {
    const messages = (payload as any).errors
      .map((item: Record<string, unknown>) => {
        const message = typeof item.message === 'string' ? item.message.trim() : '';
        return message;
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return `SendGrid request failed with status ${status}: ${messages.join('; ')}`;
    }
  }

  return `SendGrid request failed with status ${status}.`;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async sendEmail(input: { to: string; subject?: string; body: string; htmlBody?: string }) {
    const settings = await strapi.plugin('sendgrid-email').service('settings').getResolvedSettings();

    if (!settings.enabled) {
      throw new Error('SendGrid email delivery is disabled.');
    }

    if (!settings.apiKey) {
      throw new Error('SendGrid API key is not configured.');
    }

    if (!settings.fromEmail) {
      throw new Error('SendGrid sender email is not configured.');
    }

    const htmlBody = input.htmlBody?.trim() || `<pre>${escapeHtml(input.body)}</pre>`;
    const subject = input.subject?.trim() || 'Notification';
    const replyToEmail = settings.replyToEmail.trim();

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: input.to }],
            subject,
          },
        ],
        from: {
          email: settings.fromEmail,
          ...(settings.fromName ? { name: settings.fromName } : {}),
        },
        ...(replyToEmail
          ? {
              reply_to: {
                email: replyToEmail,
                ...(settings.replyToName ? { name: settings.replyToName } : {}),
              },
            }
          : {}),
        content: [
          { type: 'text/plain', value: input.body },
          { type: 'text/html', value: htmlBody },
        ],
      }),
    });

    if (!response.ok) {
      let payload: unknown;

      try {
        payload = await response.json();
      } catch {
        payload = undefined;
      }

      throw new Error(normalizeErrorMessage(response.status, payload));
    }

    strapi.log.info(`[sendgrid-email] delivered email to=${input.to} subject=${subject}`);

    return {
      accepted: true,
      to: input.to,
      subject,
    };
  },
});

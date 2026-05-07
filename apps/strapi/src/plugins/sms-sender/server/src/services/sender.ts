import type { Core } from '@strapi/strapi';

function normalizeErrorMessage(status: number, payload: unknown) {
  if (payload && typeof payload === 'object' && Array.isArray((payload as any).errors)) {
    const messages = (payload as any).errors
      .map((item: Record<string, unknown>) => {
        const message = typeof item.message === 'string' ? item.message.trim() : '';
        return message;
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return `SMS sender request failed with status ${status}: ${messages.join('; ')}`;
    }
  }

  if (payload && typeof payload === 'object' && typeof (payload as any).message === 'string' && (payload as any).message.trim()) {
    return `SMS sender request failed with status ${status}: ${(payload as any).message.trim()}`;
  }

  return `SMS sender request failed with status ${status}.`;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async sendSms(input: { to: string; body: string }) {
    const settings = await strapi.plugin('sms-sender').service('settings').getResolvedSettings();

    if (!settings.enabled) {
      throw new Error('SMS delivery is disabled.');
    }

    if (!settings.senderUrl) {
      throw new Error('SMS sender URL is not configured.');
    }

    if (!settings.apiKey) {
      throw new Error('SMS API key is not configured.');
    }

    if (!settings.apiSecret) {
      throw new Error('SMS API secret is not configured.');
    }

    const response = await fetch(settings.senderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: input.to,
        content: input.body,
        apiKey: settings.apiKey,
        apiSecret: settings.apiSecret,
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

    strapi.log.info(`[sms-sender] delivered sms to=${input.to}`);

    return {
      accepted: true,
      to: input.to,
    };
  },
});

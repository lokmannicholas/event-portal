import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async getSettings(ctx: any) {
    ctx.body = await strapi.plugin('sms-sender').service('settings').getSettingsSummary();
  },

  async updateSettings(ctx: any) {
    ctx.body = await strapi.plugin('sms-sender').service('settings').saveSettings(ctx.request.body as Record<string, unknown>);
  },

  async resetSettings(ctx: any) {
    ctx.body = await strapi.plugin('sms-sender').service('settings').clearSettings();
  },
});

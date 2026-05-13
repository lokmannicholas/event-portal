import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async erpEformDetail(ctx: any) {
    ctx.body = await strapi.service('plugin::eform.portal').erpEformDetail(ctx.params.documentId, String(ctx.query.partitionCode ?? ''));
  },

  async createEformSubmission(ctx: any) {
    ctx.body = await strapi.service('plugin::eform.portal').createEformSubmission(ctx.request.body as any);
  },
});

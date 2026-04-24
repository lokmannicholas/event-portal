import { factories } from '@strapi/strapi';
import { normalizeContentTypePayload } from '../utils/controller-payload';

const uid = 'plugin::event-portal.user-partition';

export default factories.createCoreController(uid, ({ strapi }) => ({
  async create(ctx: any) {
    ctx.request.body = normalizeContentTypePayload(strapi, uid, ctx.request.body).body;
    return await super.create(ctx);
  },

  async update(ctx: any) {
    ctx.request.body = normalizeContentTypePayload(strapi, uid, ctx.request.body).body;
    return await super.update(ctx);
  },
}));

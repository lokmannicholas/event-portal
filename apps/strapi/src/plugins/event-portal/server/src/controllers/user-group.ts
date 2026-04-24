import { Core, factories } from '@strapi/strapi';
import { normalizeContentTypePayload, syncInverseRelations } from '../utils/controller-payload';

const uid = 'plugin::event-portal.user-group';

export default factories.createCoreController(uid, ({ strapi }: { strapi: Core.Strapi }) => ({
  async create(ctx: any) {
    const normalized = normalizeContentTypePayload(strapi, uid, ctx.request.body);
    ctx.request.body = normalized.body;

    const response = await super.create(ctx);
    const documentId = response?.data?.documentId;

    if (typeof documentId === 'string' && documentId) {
      await syncInverseRelations(strapi, uid, documentId, normalized.inverseRelations);
    }

    return response;
  },

  async update(ctx: any) {
    const normalized = normalizeContentTypePayload(strapi, uid, ctx.request.body);
    ctx.request.body = normalized.body;

    const response = await super.update(ctx);
    const documentId = response?.data?.documentId ?? ctx.params.documentId;

    if (typeof documentId === 'string' && documentId) {
      await syncInverseRelations(strapi, uid, documentId, normalized.inverseRelations);
    }

    return response;
  },
}));

import { factories } from '@strapi/strapi';
import { normalizeContentTypePayload, syncInverseRelations } from '../utils/controller-payload';

const uid = 'plugin::eform.integration-system' as any;

export default factories.createCoreController(uid, ({ strapi }) => ({
  async create(ctx: any) {
    const normalized = normalizeContentTypePayload(strapi, uid, ctx.request.body);
    ctx.request.body = normalized.body;
    const response = await super.create(ctx);
    const documentId = response?.data?.documentId;

    if (documentId) {
      await syncInverseRelations(strapi, uid, documentId, normalized.inverseRelations);
    }

    return response;
  },

  async update(ctx: any) {
    const normalized = normalizeContentTypePayload(strapi, uid, ctx.request.body);
    ctx.request.body = normalized.body;
    const response = await super.update(ctx);
    const documentId = response?.data?.documentId ?? ctx.params.documentId;

    if (documentId) {
      await syncInverseRelations(strapi, uid, documentId, normalized.inverseRelations);
    }

    return response;
  },
}));

import { Core, factories } from '@strapi/strapi';
import { normalizeContentTypePayload, syncInverseRelations } from '../utils/controller-payload';

const uid = 'plugin::event-portal.event';

function getRequestData(body: unknown) {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const payload = body as { data?: unknown };
  return payload.data && typeof payload.data === 'object'
    ? (payload.data as Record<string, unknown>)
    : (body as Record<string, unknown>);
}

function stripEventSlotFields(body: Record<string, unknown>) {
  const nextBody = { ...body };
  delete nextBody.eventSlots;
  delete nextBody.slotPlan;
  return nextBody;
}

export default factories.createCoreController(uid, ({ strapi }: { strapi: Core.Strapi }) => ({
  async create(ctx: any) {
    ctx.state.auth = false;
    const requestData = getRequestData(ctx.request.body);
    const eventSlots = (strapi.service(uid) as any).normalizeEventSlots(requestData.eventSlots ?? requestData.slotPlan);
    const normalized = normalizeContentTypePayload(strapi, uid, {
      ...(ctx.request.body as Record<string, unknown>),
      data: stripEventSlotFields(requestData),
    });
    ctx.request.body = normalized.body;

    const response = await super.create(ctx);
    const documentId = response?.data?.documentId;

    if (typeof documentId === 'string' && documentId) {
      try {
        await syncInverseRelations(strapi, uid, documentId, normalized.inverseRelations);
        await (strapi.service(uid) as any).syncEventSlots(documentId, eventSlots);
      } catch (error) {
        await strapi.documents(uid).delete({
          documentId,
        }).catch(() => undefined);
        throw error;
      }
    }

    return response;
  },

  async update(ctx: any) {
    ctx.state.auth = false;
    const requestData = getRequestData(ctx.request.body);
    const eventSlots = (strapi.service(uid) as any).normalizeEventSlots(requestData.eventSlots ?? requestData.slotPlan);
    const normalized = normalizeContentTypePayload(strapi, uid, {
      ...(ctx.request.body as Record<string, unknown>),
      data: stripEventSlotFields(requestData),
    });
    ctx.request.body = normalized.body;


    const response = await super.update(ctx);
    const documentId = response?.data?.documentId ?? ctx.params.documentId;

    if (typeof documentId === 'string' && documentId) {
      await syncInverseRelations(strapi, uid, documentId, normalized.inverseRelations);
      await (strapi.service(uid) as any).syncEventSlots(documentId, eventSlots);
    }

    return response;
  },
}));

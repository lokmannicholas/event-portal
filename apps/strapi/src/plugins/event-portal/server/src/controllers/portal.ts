import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async eapDashboard(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').eapDashboard();
  },

  async eapPartitions(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').eapPartitions();
  },

  async eapGroups(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').eapGroups();
  },

  async eapUsers(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').eapUsers();
  },

  async eapUser(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').eapUser(ctx.params.documentId);
  },

  async eapTemplates(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').eapTemplates();
  },

  async sendNotices(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').sendNotices(ctx.request.body as any);
  },

  async eapEvents(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').eapEvents();
  },

  async eapAppointments(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').eapAppointments(ctx.query.eventDocumentId as string | undefined);
  },

  async eapDocuments(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').portalDocuments('EAP');
  },

  async eapContacts(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').portalContacts('EAP');
  },

  async managementUsers(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').managementUsers();
  },

  async managementUser(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').managementUser(ctx.params.documentId);
  },

  async createManagementUser(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').createManagementUser(ctx.request.body as any);
  },

  async replaceManagementUser(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').replaceManagementUser(ctx.params.documentId, ctx.request.body as any);
  },

  async updateManagementUser(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').updateManagementUser(ctx.params.documentId, ctx.request.body as any);
  },

  async generateEventFromTemplate(ctx: any) {
    ctx.body = await strapi
      .service('plugin::event-portal.portal')
      .generateEventFromTemplate(ctx.params.documentId, (ctx.request.body as any)?.actorEmail);
  },

  async publishEvent(ctx: any) {
    ctx.body = await strapi
      .service('plugin::event-portal.portal')
      .publishEvent(ctx.params.documentId, (ctx.request.body as any)?.actorEmail);
  },

  async syncManagementEventSlots(ctx: any) {
    ctx.body = await strapi
      .service('plugin::event-portal.portal')
      .syncManagementEventSlots(ctx.params.documentId, (ctx.request.body as any)?.slots);
  },

  async unpublishEvent(ctx: any) {
    ctx.body = await strapi
      .service('plugin::event-portal.portal')
      .unpublishEvent(ctx.params.documentId, (ctx.request.body as any)?.actorEmail);
  },

  async disableEvent(ctx: any) {
    ctx.body = await strapi
      .service('plugin::event-portal.portal')
      .disableEvent(ctx.params.documentId, (ctx.request.body as any)?.actorEmail);
  },

  async cancelAppointment(ctx: any) {
    const payload = (ctx.request.body as any) ?? {};
    ctx.body = await strapi
      .service('plugin::event-portal.portal')
      .cancelAppointment(
        ctx.params.documentId,
        ctx.state.user?.email ?? payload.actorEmail ?? 'admin@local',
        'EAP',
        payload.reason,
      );
  },

  async ecpDashboard(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').ecpDashboard(String(ctx.query.groupCode ?? ''));
  },

  async ecpEvents(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').ecpEvents(String(ctx.query.groupCode ?? ''));
  },

  async ecpEventDetail(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').ecpEventDetail(ctx.params.documentId, String(ctx.query.groupCode ?? ''));
  },

  async ecpAppointments(ctx: any) {
    ctx.body = await strapi
      .service('plugin::event-portal.portal')
      .ecpAppointments(String(ctx.query.groupCode ?? ''), ctx.query.eventDocumentId as string | undefined);
  },

  async ecpCancelAppointment(ctx: any) {
    const payload = (ctx.request.body as any) ?? {};
    ctx.body = await strapi
      .service('plugin::event-portal.portal')
      .cancelAppointment(
        ctx.params.documentId,
        ctx.state.user?.email ?? payload.actorEmail ?? 'client@local',
        'ECP',
        payload.reason,
        undefined,
        String(payload.groupCode ?? ctx.query.groupCode ?? ''),
      );
  },

  async ecpDocuments(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').ecpDocuments(String(ctx.query.groupCode ?? ''));
  },

  async ecpContacts(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').ecpContacts(String(ctx.query.groupCode ?? ''));
  },

  async erpPartitionLanding(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').erpPartitionLanding(ctx.params.partitionCode);
  },

  async erpEventDetail(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').erpEventDetail(ctx.params.documentId, String(ctx.query.partitionCode ?? ''));
  },

  async erpEformDetail(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').erpEformDetail(ctx.params.documentId, String(ctx.query.partitionCode ?? ''));
  },

  async erpDocuments(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').portalDocuments('ERP');
  },

  async erpContacts(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').portalContacts('ERP');
  },

  async createHold(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').createHold(ctx.request.body as any);
  },

  async createBooking(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').createBooking(ctx.request.body as any);
  },

  async createEformSubmission(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').createEformSubmission(ctx.request.body as any);
  },

  async createEnquiry(ctx: any) {
    ctx.body = await strapi.service('plugin::event-portal.portal').createEnquiry(ctx.request.body as any);
  },

  async erpCancelAppointment(ctx: any) {
    const payload = (ctx.request.body as any) ?? {};
    ctx.body = await strapi
      .service('plugin::event-portal.portal')
      .cancelAppointment(ctx.params.documentId, 'public-user', 'ERP', payload.reason, payload.cancelToken ?? ctx.query.token);
  },
});

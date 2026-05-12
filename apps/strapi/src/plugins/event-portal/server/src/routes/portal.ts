const eapRouteAccess = {
  auth: false as const,
  middlewares: ['plugin::event-portal.eap-access'],
};

const ecpRouteAccess = {
  auth: false as const,
  middlewares: ['plugin::event-portal.ecp-access'],
};

const erpRouteAccess = {
  auth: false as const,
  middlewares: ['plugin::event-portal.erp-access'],
};

export default {
  type: 'content-api',
  prefix: '',
  routes: [
    { method: 'GET', path: '/portal/eap/dashboard', handler: 'portal.eapDashboard', config: eapRouteAccess },
    { method: 'GET', path: '/portal/eap/partitions', handler: 'portal.eapPartitions', config: eapRouteAccess },
    { method: 'GET', path: '/portal/eap/groups', handler: 'portal.eapGroups', config: eapRouteAccess },
    { method: 'GET', path: '/portal/eap/users', handler: 'portal.eapUsers', config: eapRouteAccess },
    { method: 'GET', path: '/portal/eap/users/:documentId', handler: 'portal.eapUser', config: eapRouteAccess },
    { method: 'GET', path: '/portal/eap/templates', handler: 'portal.eapTemplates', config: eapRouteAccess },
    { method: 'POST', path: '/portal/management/notices/send', handler: 'portal.sendNotices', config: eapRouteAccess },
    { method: 'GET', path: '/portal/eap/events', handler: 'portal.eapEvents', config: eapRouteAccess },
    { method: 'GET', path: '/portal/eap/appointments', handler: 'portal.eapAppointments', config: eapRouteAccess },
    { method: 'GET', path: '/portal/eap/documents', handler: 'portal.eapDocuments', config: eapRouteAccess },
    { method: 'GET', path: '/portal/eap/contacts', handler: 'portal.eapContacts', config: eapRouteAccess },

    { method: 'GET', path: '/portal/management/users', handler: 'portal.managementUsers', config: eapRouteAccess },
    { method: 'GET', path: '/portal/management/users/:documentId', handler: 'portal.managementUser', config: eapRouteAccess },
    { method: 'POST', path: '/portal/management/users', handler: 'portal.createManagementUser', config: eapRouteAccess },
    { method: 'PUT', path: '/portal/management/users/:documentId', handler: 'portal.replaceManagementUser', config: eapRouteAccess },
    { method: 'PATCH', path: '/portal/management/users/:documentId', handler: 'portal.updateManagementUser', config: eapRouteAccess },

    { method: 'POST', path: '/portal/management/templates/:documentId/generate', handler: 'portal.generateEventFromTemplate', config: eapRouteAccess },
    { method: 'POST', path: '/portal/management/events/:documentId/publish', handler: 'portal.publishEvent', config: eapRouteAccess },
    { method: 'POST', path: '/portal/management/events/:documentId/slots', handler: 'portal.syncManagementEventSlots', config: eapRouteAccess },
    { method: 'POST', path: '/portal/management/events/:documentId/unpublish', handler: 'portal.unpublishEvent', config: eapRouteAccess },
    { method: 'POST', path: '/portal/management/events/:documentId/disable', handler: 'portal.disableEvent', config: eapRouteAccess },
    { method: 'POST', path: '/portal/management/appointments/:documentId/cancel', handler: 'portal.cancelAppointment', config: eapRouteAccess },

    { method: 'GET', path: '/portal/ecp/dashboard', handler: 'portal.ecpDashboard', config: ecpRouteAccess },
    { method: 'GET', path: '/portal/ecp/events', handler: 'portal.ecpEvents', config: ecpRouteAccess },
    { method: 'GET', path: '/portal/ecp/events/:documentId', handler: 'portal.ecpEventDetail', config: ecpRouteAccess },
    { method: 'GET', path: '/portal/ecp/appointments', handler: 'portal.ecpAppointments', config: ecpRouteAccess },
    { method: 'POST', path: '/portal/ecp/appointments/:documentId/cancel', handler: 'portal.ecpCancelAppointment', config: ecpRouteAccess },
    { method: 'GET', path: '/portal/ecp/documents', handler: 'portal.ecpDocuments', config: ecpRouteAccess },
    { method: 'GET', path: '/portal/ecp/contacts', handler: 'portal.ecpContacts', config: ecpRouteAccess },

    { method: 'GET', path: '/portal/erp/partitions/:partitionCode', handler: 'portal.erpPartitionLanding', config: erpRouteAccess },
    { method: 'GET', path: '/portal/erp/events/:documentId', handler: 'portal.erpEventDetail', config: erpRouteAccess },
    { method: 'GET', path: '/portal/erp/eforms/:documentId', handler: 'portal.erpEformDetail', config: erpRouteAccess },
    { method: 'GET', path: '/portal/erp/documents', handler: 'portal.erpDocuments', config: erpRouteAccess },
    { method: 'GET', path: '/portal/erp/contacts', handler: 'portal.erpContacts', config: erpRouteAccess },
    { method: 'POST', path: '/portal/erp/holds', handler: 'portal.createHold', config: erpRouteAccess },
    { method: 'POST', path: '/portal/erp/bookings', handler: 'portal.createBooking', config: erpRouteAccess },
    { method: 'POST', path: '/portal/erp/eforms/submissions', handler: 'portal.createEformSubmission', config: erpRouteAccess },
    { method: 'POST', path: '/portal/erp/enquiries', handler: 'portal.createEnquiry', config: erpRouteAccess },
    { method: 'POST', path: '/portal/erp/cancellations/:documentId', handler: 'portal.erpCancelAppointment', config: erpRouteAccess }
  ],
};

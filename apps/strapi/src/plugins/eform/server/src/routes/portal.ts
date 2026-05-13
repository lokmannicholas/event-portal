import { erpRouteAccess } from './core-access';

export default {
  type: 'content-api',
  prefix: '',
  routes: [
    { method: 'GET', path: '/portal/erp/eforms/:documentId', handler: 'portal.erpEformDetail', config: erpRouteAccess },
    { method: 'POST', path: '/portal/erp/eforms/submissions', handler: 'portal.createEformSubmission', config: erpRouteAccess },
  ],
};

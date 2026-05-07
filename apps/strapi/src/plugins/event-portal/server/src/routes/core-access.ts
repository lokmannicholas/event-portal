export const eapRouteAccess = {
  auth: false as const,
  middlewares: ['plugin::event-portal.eap-access'],
};

export const eapCrudRouteConfig = {
  find: eapRouteAccess,
  findOne: eapRouteAccess,
  create: eapRouteAccess,
  update: eapRouteAccess,
  delete: eapRouteAccess,
};

import type { Core } from '@strapi/strapi';
import { assertAdminAccess, assertDeleteBlocked, authenticatePortalUser } from './portal-auth';

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<unknown>) => {
    assertDeleteBlocked(ctx, 'Delete is not allowed for EAP APIs.');
    const user = await authenticatePortalUser(strapi, ctx);
    assertAdminAccess(user);
    return next();
  };
};

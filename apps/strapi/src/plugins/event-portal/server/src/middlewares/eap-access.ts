import type { Core } from '@strapi/strapi';
import { assertAdminAccess, assertDeleteBlocked, authenticatePortalUser } from './portal-auth';

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<unknown>) => {
    assertDeleteBlocked(ctx, 'Delete is not allowed for EAP APIs.');
    const user = await authenticatePortalUser(strapi, ctx);
    assertAdminAccess(user);
    // These routes use custom portal auth instead of Strapi's scope-based content API auth.
    // Disable downstream relation scope validation for owner-side CRUD payloads.
    ctx.state.auth = false;
    return next();
  };
};

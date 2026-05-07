import type { Core } from '@strapi/strapi';
import {
  assertClientGroupAccess,
  assertDeleteBlocked,
  authenticatePortalUser,
  getRequestGroupCode,
} from './portal-auth';

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<unknown>) => {
    assertDeleteBlocked(ctx, 'Delete is not allowed for ECP APIs.');
    const user = await authenticatePortalUser(strapi, ctx);
    assertClientGroupAccess(user, getRequestGroupCode(ctx));
    return next();
  };
};

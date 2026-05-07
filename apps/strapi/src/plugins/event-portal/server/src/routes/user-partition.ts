import { factories } from '@strapi/strapi';
import { eapCrudRouteConfig } from './core-access';

export default factories.createCoreRouter('plugin::event-portal.user-partition', { prefix: '', config: eapCrudRouteConfig });

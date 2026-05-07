import { factories } from '@strapi/strapi';
import { eapCrudRouteConfig } from './core-access';

export default factories.createCoreRouter('plugin::event-portal.portal-document', { prefix: '', config: eapCrudRouteConfig });

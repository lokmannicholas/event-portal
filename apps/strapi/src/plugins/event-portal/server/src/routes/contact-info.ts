import { factories } from '@strapi/strapi';
import { eapCrudRouteConfig } from './core-access';

export default factories.createCoreRouter('plugin::event-portal.contact-info', { prefix: '', config: eapCrudRouteConfig });

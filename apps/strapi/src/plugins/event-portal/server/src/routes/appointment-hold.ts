import { factories } from '@strapi/strapi';
import { eapCrudRouteConfig } from './core-access';

export default factories.createCoreRouter('plugin::event-portal.appointment-hold', { prefix: '', config: eapCrudRouteConfig });

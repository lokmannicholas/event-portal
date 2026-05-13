import { factories } from '@strapi/strapi';
import { eapCrudRouteConfig } from './core-access';

export default factories.createCoreRouter('plugin::eform.integration-system' as any, { prefix: '', config: eapCrudRouteConfig });

import { factories } from '@strapi/strapi';
import { eapCrudRouteConfig } from './core-access';

export default factories.createCoreRouter('plugin::eform.eform-submission' as any, { prefix: '', config: eapCrudRouteConfig });

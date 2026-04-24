import type { Core } from '@strapi/strapi';
import fieldConfig from './components/form/field-config';
import templateMessage from './components/notification/template-message';

const componentSchemas = {
  'event-portal.field-config': fieldConfig,
  'event-portal.template-message': templateMessage,
} as const;

function toGlobalId(uid: string) {
  return `Component${uid.split('.').map((segment) => segment.replace(/(^|-)([a-z])/g, (_match, _dash, char) => char.toUpperCase())).join('')}`;
}

function buildComponent(uid: string, schema: Record<string, any>) {
  const [category, modelName] = uid.split('.');

  return {
    ...schema,
    __schema__: JSON.parse(JSON.stringify(schema)),
    uid,
    category,
    modelType: 'component',
    modelName,
    globalId: schema.globalId || toGlobalId(uid),
  };
}

export function register({ strapi }: { strapi: Core.Strapi }) {
  const components = Object.fromEntries(
    Object.entries(componentSchemas).map(([uid, schema]) => [uid, buildComponent(uid, schema as Record<string, any>)]),
  );

  strapi.get('components').add(components);
}

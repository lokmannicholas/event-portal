import type { Core } from '@strapi/strapi';
import fieldConfig from './components/form/field-config';
import templateMessage from './components/notification/template-message';

type RegisteredComponent = {
  filename: string;
  schema: Record<string, any>;
};

const componentSchemas = {
  'event-portal.field-config': {
    filename: 'field-config.json',
    schema: fieldConfig,
  },
  'event-portal.template-message': {
    filename: 'template-message.json',
    schema: templateMessage,
  },
} as const;

function toGlobalId(uid: string) {
  return `Component${uid.split('.').map((segment) => segment.replace(/(^|-)([a-z])/g, (_match, _dash, char) => char.toUpperCase())).join('')}`;
}

function buildComponent(uid: string, component: RegisteredComponent) {
  const [category, modelName] = uid.split('.');
  const { filename, schema } = component;

  return {
    ...schema,
    // Strapi's content-type builder rollback reads this to reconstruct schema paths.
    __schema__: JSON.parse(JSON.stringify(schema)),
    __filename__: filename,
    uid,
    category,
    modelType: 'component',
    modelName,
    globalId: schema.globalId || toGlobalId(uid),
  };
}

export function register({ strapi }: { strapi: Core.Strapi }) {
  const components = Object.fromEntries(
    Object.entries(componentSchemas).map(([uid, component]) => [uid, buildComponent(uid, component)]),
  );

  strapi.get('components').add(components);
}

export default [
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  {
    name: 'strapi::favicon',
    config: {
      path: 'public/favicon.svg',
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::public',
];

export default {
  type: 'admin',
  prefix: '',
  routes: [
    {
      method: 'GET',
      path: '/settings',
      handler: 'settings.getSettings',
      config: { policies: ['admin::isAuthenticatedAdmin'] },
    },
    {
      method: 'PUT',
      path: '/settings',
      handler: 'settings.updateSettings',
      config: { policies: ['admin::isAuthenticatedAdmin'] },
    },
    {
      method: 'DELETE',
      path: '/settings',
      handler: 'settings.resetSettings',
      config: { policies: ['admin::isAuthenticatedAdmin'] },
    },
  ],
};

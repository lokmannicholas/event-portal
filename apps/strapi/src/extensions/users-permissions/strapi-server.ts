type StrapiPlugin = {
  contentTypes?: Record<string, any>;
  controllers?: Record<string, any>;
};

export default function usersPermissionsExtension(plugin: StrapiPlugin) {
  const userSchema = plugin.contentTypes?.user?.schema;

  if (userSchema?.attributes) {
    userSchema.attributes = {
      ...userSchema.attributes,
      portalRole: {
        type: 'enumeration',
        enum: ['ADMIN', 'CLIENT_HR'],
        default: 'CLIENT_HR',
      },
      lastLoginAt: {
        type: 'datetime',
      },
      userGroups: {
        type: 'relation',
        relation: 'manyToMany',
        target: 'plugin::event-portal.user-group',
        inversedBy: 'portalUsers',
      },
    };
  }

  // const originalCallback = plugin.controllers.auth.callback;

  // plugin.controllers.auth.callback = async (ctx) => {
  //   const response = await originalCallback(ctx);
  //   const user = ctx.body?.user;
  //   const strapiInstance = global.strapi;

  //   if (!strapiInstance || (!user?.documentId && !user?.id)) {
  //     return response;
  //   }

  //   if (user.documentId) {
  //     await strapiInstance.documents('plugin::users-permissions.user').update({
  //       documentId: user.documentId,
  //       data: {
  //         lastLoginAt: new Date().toISOString(),
  //       },
  //     });
  //     return response;
  //   }

  //   await strapiInstance.db.query('plugin::users-permissions.user').update({
  //     where: { id: user.id },
  //     data: {
  //       lastLoginAt: new Date().toISOString(),
  //     },
  //   });

  //   return response;
  // };

  return plugin;
}

import { prefixPluginTranslations } from './utils/prefixPluginTranslations';

const pluginId = 'sendgrid-email';

export default {
  register(app) {
    app.createSettingSection(
      {
        id: pluginId,
        intlLabel: {
          id: `${pluginId}.settings.section-label`,
          defaultMessage: 'SendGrid Email',
        },
      },
      [
        {
          intlLabel: {
            id: `${pluginId}.settings.link-label`,
            defaultMessage: 'Configuration',
          },
          id: 'settings',
          to: pluginId,
          Component: () => import('./pages/SettingsPage'),
        },
      ],
    );

    app.registerPlugin({
      id: pluginId,
      name: pluginId,
    });
  },

  bootstrap() {},

  async registerTrads({ locales }) {
    return Promise.all(
      locales.map((locale) =>
        import(`./translations/${locale}.json`)
          .then(({ default: data }) => ({
            data: prefixPluginTranslations(data, pluginId),
            locale,
          }))
          .catch(() => ({
            data: {},
            locale,
          })),
      ),
    );
  },
};

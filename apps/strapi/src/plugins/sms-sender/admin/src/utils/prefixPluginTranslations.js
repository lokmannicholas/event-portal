export function prefixPluginTranslations(data, pluginId) {
  return Object.keys(data).reduce((acc, current) => {
    acc[`${pluginId}.${current}`] = data[current];
    return acc;
  }, {});
}

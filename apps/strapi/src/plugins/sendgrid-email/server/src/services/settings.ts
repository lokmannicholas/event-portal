import type { Core } from '@strapi/strapi';

type ConfigSource = 'ENV' | 'ADMIN' | 'MISSING';

type StoredSettings = {
  enabled?: boolean;
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
  replyToEmail?: string;
  replyToName?: string;
  updatedAt?: string;
};

type ResolvedSettings = {
  enabled: boolean;
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
  replyToName: string;
};

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function hasStoredOverrides(value: StoredSettings | null) {
  if (!value) {
    return false;
  }

  return ['enabled', 'apiKey', 'fromEmail', 'fromName', 'replyToEmail', 'replyToName'].some((key) => {
    const current = value[key as keyof StoredSettings];
    return current !== undefined && current !== '';
  });
}

function apiKeySource(stored: StoredSettings | null, resolved: ResolvedSettings): ConfigSource {
  if (normalizeString(stored?.apiKey)) {
    return 'ADMIN';
  }

  if (resolved.apiKey) {
    return 'ENV';
  }

  return 'MISSING';
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async getStoredSettings(): Promise<StoredSettings | null> {
    const store = strapi.store({ type: 'plugin', name: 'sendgrid-email' });
    const value = await store.get({ key: 'settings' });

    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;

    return {
      enabled: typeof record.enabled === 'boolean' ? record.enabled : undefined,
      apiKey: normalizeString(record.apiKey) || undefined,
      fromEmail: normalizeString(record.fromEmail) || undefined,
      fromName: normalizeString(record.fromName) || undefined,
      replyToEmail: normalizeString(record.replyToEmail) || undefined,
      replyToName: normalizeString(record.replyToName) || undefined,
      updatedAt: normalizeString(record.updatedAt) || undefined,
    };
  },

  getEnvSettings(): StoredSettings {
    const config = (strapi.config.get('plugin::sendgrid-email') ?? {}) as Record<string, unknown>;

    return {
      enabled: normalizeBoolean(config.enabled, false),
      apiKey: normalizeString(config.apiKey) || undefined,
      fromEmail: normalizeString(config.fromEmail) || undefined,
      fromName: normalizeString(config.fromName) || undefined,
      replyToEmail: normalizeString(config.replyToEmail) || undefined,
      replyToName: normalizeString(config.replyToName) || undefined,
    };
  },

  async getResolvedSettings(): Promise<ResolvedSettings> {
    const envSettings = this.getEnvSettings();
    const storedSettings = await this.getStoredSettings();

    return {
      enabled: storedSettings?.enabled ?? envSettings.enabled ?? false,
      apiKey: normalizeString(storedSettings?.apiKey) || normalizeString(envSettings.apiKey),
      fromEmail: normalizeString(storedSettings?.fromEmail) || normalizeString(envSettings.fromEmail),
      fromName: normalizeString(storedSettings?.fromName) || normalizeString(envSettings.fromName),
      replyToEmail: normalizeString(storedSettings?.replyToEmail) || normalizeString(envSettings.replyToEmail),
      replyToName: normalizeString(storedSettings?.replyToName) || normalizeString(envSettings.replyToName),
    };
  },

  async getSettingsSummary() {
    const storedSettings = await this.getStoredSettings();
    const resolvedSettings = await this.getResolvedSettings();

    return {
      enabled: resolvedSettings.enabled,
      fromEmail: resolvedSettings.fromEmail,
      fromName: resolvedSettings.fromName || undefined,
      replyToEmail: resolvedSettings.replyToEmail || undefined,
      replyToName: resolvedSettings.replyToName || undefined,
      apiKeyConfigured: Boolean(resolvedSettings.apiKey),
      apiKeySource: apiKeySource(storedSettings, resolvedSettings),
      portalOverrideActive: hasStoredOverrides(storedSettings),
      updatedAt: storedSettings?.updatedAt,
    };
  },

  async saveSettings(input: Record<string, unknown>) {
    const existing = await this.getStoredSettings();
    const store = strapi.store({ type: 'plugin', name: 'sendgrid-email' });
    const nextSettings: StoredSettings = {
      enabled: normalizeBoolean(input.enabled, false),
      apiKey: normalizeString(input.apiKey) || existing?.apiKey,
      fromEmail: normalizeString(input.fromEmail) || undefined,
      fromName: normalizeString(input.fromName) || undefined,
      replyToEmail: normalizeString(input.replyToEmail) || undefined,
      replyToName: normalizeString(input.replyToName) || undefined,
      updatedAt: new Date().toISOString(),
    };

    await store.set({
      key: 'settings',
      value: nextSettings,
    });

    return this.getSettingsSummary();
  },

  async clearSettings() {
    const store = strapi.store({ type: 'plugin', name: 'sendgrid-email' });

    await store.set({
      key: 'settings',
      value: null,
    });

    return this.getSettingsSummary();
  },
});

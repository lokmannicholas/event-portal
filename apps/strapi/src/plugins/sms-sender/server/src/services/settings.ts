import type { Core } from '@strapi/strapi';

type ConfigSource = 'ENV' | 'ADMIN' | 'MISSING';

type StoredSettings = {
  enabled?: boolean;
  apiKey?: string;
  apiSecret?: string;
  senderUrl?: string;
  updatedAt?: string;
};

type ResolvedSettings = {
  enabled: boolean;
  apiKey: string;
  apiSecret: string;
  senderUrl: string;
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

  return ['enabled', 'apiKey', 'apiSecret', 'senderUrl'].some((key) => {
    const current = value[key as keyof StoredSettings];
    return current !== undefined && current !== '';
  });
}

function resolveConfigSource(storedValue: string | undefined, resolvedValue: string): ConfigSource {
  if (normalizeString(storedValue)) {
    return 'ADMIN';
  }

  if (resolvedValue) {
    return 'ENV';
  }

  return 'MISSING';
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async getStoredSettings(): Promise<StoredSettings | null> {
    const store = strapi.store({ type: 'plugin', name: 'sms-sender' });
    const value = await store.get({ key: 'settings' });

    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;

    return {
      enabled: typeof record.enabled === 'boolean' ? record.enabled : undefined,
      apiKey: normalizeString(record.apiKey) || undefined,
      apiSecret: normalizeString(record.apiSecret) || undefined,
      senderUrl: normalizeString(record.senderUrl) || undefined,
      updatedAt: normalizeString(record.updatedAt) || undefined,
    };
  },

  getEnvSettings(): StoredSettings {
    const config = (strapi.config.get('plugin::sms-sender') ?? {}) as Record<string, unknown>;

    return {
      enabled: normalizeBoolean(config.enabled, false),
      apiKey: normalizeString(config.apiKey) || undefined,
      apiSecret: normalizeString(config.apiSecret) || undefined,
      senderUrl: normalizeString(config.senderUrl) || undefined,
    };
  },

  async getResolvedSettings(): Promise<ResolvedSettings> {
    const envSettings = this.getEnvSettings();
    const storedSettings = await this.getStoredSettings();

    return {
      enabled: storedSettings?.enabled ?? envSettings.enabled ?? false,
      apiKey: normalizeString(storedSettings?.apiKey) || normalizeString(envSettings.apiKey),
      apiSecret: normalizeString(storedSettings?.apiSecret) || normalizeString(envSettings.apiSecret),
      senderUrl: normalizeString(storedSettings?.senderUrl) || normalizeString(envSettings.senderUrl),
    };
  },

  async getSettingsSummary() {
    const storedSettings = await this.getStoredSettings();
    const resolvedSettings = await this.getResolvedSettings();

    return {
      enabled: resolvedSettings.enabled,
      senderUrl: resolvedSettings.senderUrl || undefined,
      apiKeyConfigured: Boolean(resolvedSettings.apiKey),
      apiKeySource: resolveConfigSource(storedSettings?.apiKey, resolvedSettings.apiKey),
      apiSecretConfigured: Boolean(resolvedSettings.apiSecret),
      apiSecretSource: resolveConfigSource(storedSettings?.apiSecret, resolvedSettings.apiSecret),
      senderUrlSource: resolveConfigSource(storedSettings?.senderUrl, resolvedSettings.senderUrl),
      portalOverrideActive: hasStoredOverrides(storedSettings),
      updatedAt: storedSettings?.updatedAt,
    };
  },

  async saveSettings(input: Record<string, unknown>) {
    const existing = await this.getStoredSettings();
    const store = strapi.store({ type: 'plugin', name: 'sms-sender' });
    const nextSettings: StoredSettings = {
      enabled: normalizeBoolean(input.enabled, false),
      apiKey: normalizeString(input.apiKey) || existing?.apiKey,
      apiSecret: normalizeString(input.apiSecret) || existing?.apiSecret,
      senderUrl: normalizeString(input.senderUrl) || undefined,
      updatedAt: new Date().toISOString(),
    };

    await store.set({
      key: 'settings',
      value: nextSettings,
    });

    return this.getSettingsSummary();
  },

  async clearSettings() {
    const store = strapi.store({ type: 'plugin', name: 'sms-sender' });

    await store.set({
      key: 'settings',
      value: null,
    });

    return this.getSettingsSummary();
  },
});

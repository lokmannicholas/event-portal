import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Page,
  Layouts,
  useFetchClient,
  useNotification,
} from '@strapi/admin/strapi-admin';
import {
  Box,
  Button,
  Checkbox,
  Field,
  Flex,
  Grid,
  TextInput,
  Typography,
} from '@strapi/design-system';

function getErrorMessage(error, fallback) {
  const message =
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message;

  return typeof message === 'string' && message.trim() ? message : fallback;
}

function mapSettingsToForm(settings) {
  return {
    enabled: Boolean(settings?.enabled),
    senderUrl: settings?.senderUrl ?? '',
    apiKey: '',
    apiSecret: '',
    apiKeyConfigured: Boolean(settings?.apiKeyConfigured),
    apiKeySource: settings?.apiKeySource ?? 'MISSING',
    apiSecretConfigured: Boolean(settings?.apiSecretConfigured),
    apiSecretSource: settings?.apiSecretSource ?? 'MISSING',
    senderUrlSource: settings?.senderUrlSource ?? 'MISSING',
    portalOverrideActive: Boolean(settings?.portalOverrideActive),
    updatedAt: settings?.updatedAt ?? '',
  };
}

function configStatusLabel(configured, source, adminLabel) {
  if (!configured || source === 'MISSING') {
    return 'Missing';
  }

  if (source === 'ADMIN') {
    return adminLabel;
  }

  return 'Configured in environment';
}

export default function SettingsPage() {
  const { formatMessage } = useIntl();
  const { get, put, del } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [form, setForm] = useState(() => mapSettingsToForm());

  const loadSettings = async () => {
    setIsLoading(true);

    try {
      const response = await get('/sms-sender/settings');
      setForm(mapSettingsToForm(response.data));
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: getErrorMessage(error, 'Failed to load SMS sender settings.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const handleChange = (key) => (event) => {
    const value =
      event?.target?.type === 'checkbox'
        ? Boolean(event.target.checked)
        : event?.target?.value ?? '';

    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await put('/sms-sender/settings', {
        enabled: form.enabled,
        senderUrl: form.senderUrl,
        apiKey: form.apiKey || undefined,
        apiSecret: form.apiSecret || undefined,
      });

      setForm(mapSettingsToForm(response.data));
      toggleNotification({
        type: 'success',
        message: 'SMS sender settings saved.',
      });
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: getErrorMessage(error, 'Failed to save SMS sender settings.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);

    try {
      const response = await del('/sms-sender/settings');
      setForm(mapSettingsToForm(response.data));
      toggleNotification({
        type: 'success',
        message: 'SMS sender admin override cleared.',
      });
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: getErrorMessage(error, 'Failed to reset SMS sender settings.'),
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return <Page.Loading />;
  }

  return (
    <Page.Main labelledBy="title" aria-busy={isLoading || isSaving || isResetting}>
      <Page.Title>
        {formatMessage(
          {
            id: `${pluginId}.page.title`,
            defaultMessage: 'Settings - SMS Sender',
          },
        )}
      </Page.Title>
      <Layouts.Header
        id="title"
        title={formatMessage({
          id: `${pluginId}.header.title`,
          defaultMessage: 'SMS Sender',
        })}
        subtitle={formatMessage({
          id: `${pluginId}.header.subtitle`,
          defaultMessage: 'Manage server-side SMS delivery settings used by the notice sender.',
        })}
      />
      <Layouts.Content>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" alignItems="stretch" gap={7}>
            <Box background="neutral0" hasRadius shadow="filterShadow" padding={7}>
              <Flex direction="column" alignItems="stretch" gap={5}>
                <Field.Root name="enabled">
                  <Checkbox checked={form.enabled} onCheckedChange={(checked) => setForm((current) => ({ ...current, enabled: Boolean(checked) }))}>
                    {formatMessage({
                      id: `${pluginId}.field.enabled`,
                      defaultMessage: 'Enable SMS delivery',
                    })}
                  </Checkbox>
                  <Field.Hint>
                    {formatMessage({
                      id: `${pluginId}.field.enabled.hint`,
                      defaultMessage: 'When disabled, SMS delivery calls will fail fast and notice records will be marked as failed.',
                    })}
                  </Field.Hint>
                </Field.Root>

                <Grid.Root gap={5}>
                  <Grid.Item col={6} xs={12}>
                    <Field.Root name="senderUrl" required>
                      <Field.Label>Sender URL</Field.Label>
                      <TextInput value={form.senderUrl} onChange={handleChange('senderUrl')} required />
                      <Field.Hint>The SMS plugin will POST JSON to this URL.</Field.Hint>
                    </Field.Root>
                  </Grid.Item>
                  <Grid.Item col={6} xs={12}>
                    <Field.Root name="apiKey">
                      <Field.Label>API key</Field.Label>
                      <TextInput value={form.apiKey} onChange={handleChange('apiKey')} type="password" autoComplete="off" />
                      <Field.Hint>Leave blank to keep the current configured key.</Field.Hint>
                    </Field.Root>
                  </Grid.Item>
                  <Grid.Item col={12}>
                    <Field.Root name="apiSecret">
                      <Field.Label>API secret</Field.Label>
                      <TextInput value={form.apiSecret} onChange={handleChange('apiSecret')} type="password" autoComplete="off" />
                      <Field.Hint>Leave blank to keep the current configured secret.</Field.Hint>
                    </Field.Root>
                  </Grid.Item>
                </Grid.Root>

                <Flex gap={3}>
                  <Button type="submit" loading={isSaving}>
                    Save settings
                  </Button>
                  <Button type="button" variant="tertiary" onClick={handleReset} loading={isResetting}>
                    Reset admin override
                  </Button>
                </Flex>
              </Flex>
            </Box>

            <Box background="neutral0" hasRadius shadow="filterShadow" padding={7}>
              <Flex direction="column" alignItems="stretch" gap={2}>
                <Typography variant="delta" tag="h2">
                  Current status
                </Typography>
                <Typography textColor="neutral600">
                  Effective runtime values are resolved from the admin override first, then the environment variables.
                </Typography>
                <Typography>Delivery enabled: {form.enabled ? 'Yes' : 'No'}</Typography>
                <Typography>Config source: {form.portalOverrideActive ? 'Strapi admin override' : 'Environment defaults'}</Typography>
                <Typography>Sender URL: {form.senderUrl || '-'}</Typography>
                <Typography>Sender URL source: {configStatusLabel(Boolean(form.senderUrl), form.senderUrlSource, 'Configured in Strapi admin')}</Typography>
                <Typography>API key: {configStatusLabel(form.apiKeyConfigured, form.apiKeySource, 'Configured in Strapi admin')}</Typography>
                <Typography>API secret: {configStatusLabel(form.apiSecretConfigured, form.apiSecretSource, 'Configured in Strapi admin')}</Typography>
                <Typography>Last admin update: {form.updatedAt || '-'}</Typography>
              </Flex>
            </Box>
          </Flex>
        </form>
      </Layouts.Content>
    </Page.Main>
  );
}

const pluginId = 'sms-sender';

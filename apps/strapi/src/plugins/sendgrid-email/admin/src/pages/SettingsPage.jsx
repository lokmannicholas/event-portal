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
    fromEmail: settings?.fromEmail ?? '',
    fromName: settings?.fromName ?? '',
    replyToEmail: settings?.replyToEmail ?? '',
    replyToName: settings?.replyToName ?? '',
    apiKey: '',
    apiKeyConfigured: Boolean(settings?.apiKeyConfigured),
    apiKeySource: settings?.apiKeySource ?? 'MISSING',
    portalOverrideActive: Boolean(settings?.portalOverrideActive),
    updatedAt: settings?.updatedAt ?? '',
  };
}

function apiKeyStatusLabel(form) {
  if (!form.apiKeyConfigured || form.apiKeySource === 'MISSING') {
    return 'Missing';
  }

  if (form.apiKeySource === 'ADMIN') {
    return 'Configured in Strapi admin';
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
      const response = await get('/sendgrid-email/settings');
      setForm(mapSettingsToForm(response.data));
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: getErrorMessage(error, 'Failed to load SendGrid settings.'),
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
      const response = await put('/sendgrid-email/settings', {
        enabled: form.enabled,
        fromEmail: form.fromEmail,
        fromName: form.fromName || undefined,
        replyToEmail: form.replyToEmail || undefined,
        replyToName: form.replyToName || undefined,
        apiKey: form.apiKey || undefined,
      });

      setForm(mapSettingsToForm(response.data));
      toggleNotification({
        type: 'success',
        message: 'SendGrid settings saved.',
      });
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: getErrorMessage(error, 'Failed to save SendGrid settings.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);

    try {
      const response = await del('/sendgrid-email/settings');
      setForm(mapSettingsToForm(response.data));
      toggleNotification({
        type: 'success',
        message: 'SendGrid admin override cleared.',
      });
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: getErrorMessage(error, 'Failed to reset SendGrid settings.'),
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
            defaultMessage: 'Settings - SendGrid Email',
          },
        )}
      </Page.Title>
      <Layouts.Header
        id="title"
        title={formatMessage({
          id: `${pluginId}.header.title`,
          defaultMessage: 'SendGrid Email',
        })}
        subtitle={formatMessage({
          id: `${pluginId}.header.subtitle`,
          defaultMessage: 'Manage server-side email delivery settings used by the SendGrid notice sender.',
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
                      defaultMessage: 'Enable SendGrid delivery',
                    })}
                  </Checkbox>
                  <Field.Hint>
                    {formatMessage({
                      id: `${pluginId}.field.enabled.hint`,
                      defaultMessage: 'When disabled, email delivery calls will fail fast and notice records will be marked as failed.',
                    })}
                  </Field.Hint>
                </Field.Root>

                <Grid.Root gap={5}>
                  <Grid.Item col={6} xs={12}>
                    <Field.Root name="fromEmail" required>
                      <Field.Label>From email</Field.Label>
                      <TextInput value={form.fromEmail} onChange={handleChange('fromEmail')} type="email" required />
                    </Field.Root>
                  </Grid.Item>
                  <Grid.Item col={6} xs={12}>
                    <Field.Root name="fromName">
                      <Field.Label>From name</Field.Label>
                      <TextInput value={form.fromName} onChange={handleChange('fromName')} />
                    </Field.Root>
                  </Grid.Item>
                  <Grid.Item col={6} xs={12}>
                    <Field.Root name="replyToEmail">
                      <Field.Label>Reply-to email</Field.Label>
                      <TextInput value={form.replyToEmail} onChange={handleChange('replyToEmail')} type="email" />
                    </Field.Root>
                  </Grid.Item>
                  <Grid.Item col={6} xs={12}>
                    <Field.Root name="replyToName">
                      <Field.Label>Reply-to name</Field.Label>
                      <TextInput value={form.replyToName} onChange={handleChange('replyToName')} />
                    </Field.Root>
                  </Grid.Item>
                  <Grid.Item col={12}>
                    <Field.Root name="apiKey">
                      <Field.Label>SendGrid API key</Field.Label>
                      <TextInput value={form.apiKey} onChange={handleChange('apiKey')} type="password" autoComplete="off" />
                      <Field.Hint>Leave blank to keep the current configured key.</Field.Hint>
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
                <Typography>From email: {form.fromEmail || '-'}</Typography>
                <Typography>Reply-to email: {form.replyToEmail || '-'}</Typography>
                <Typography>API key: {apiKeyStatusLabel(form)}</Typography>
                <Typography>Last admin update: {form.updatedAt || '-'}</Typography>
              </Flex>
            </Box>
          </Flex>
        </form>
      </Layouts.Content>
    </Page.Main>
  );
}

const pluginId = 'sendgrid-email';

export default ({ env }: { env: any }) => ({
  eform: {
    enabled: true,
    resolve: './src/plugins/eform',
  },
  'event-portal': {
    enabled: true,
    resolve: './src/plugins/event-portal',
  },
  'sendgrid-email': {
    enabled: true,
    resolve: './src/plugins/sendgrid-email',
    config: {
      enabled: env.bool('SENDGRID_ENABLED', false),
      apiKey: env('SENDGRID_API_KEY', ''),
      fromEmail: env('SENDGRID_FROM_EMAIL', ''),
      fromName: env('SENDGRID_FROM_NAME', ''),
      replyToEmail: env('SENDGRID_REPLY_TO_EMAIL', ''),
      replyToName: env('SENDGRID_REPLY_TO_NAME', ''),
    },
  },
  'sms-sender': {
    enabled: true,
    resolve: './src/plugins/sms-sender',
    config: {
      enabled: env.bool('SMS_SENDER_ENABLED', false),
      senderUrl: env('SMS_SENDER_URL', ''),
      apiKey: env('SMS_SENDER_API_KEY', ''),
      apiSecret: env('SMS_SENDER_API_SECRET', ''),
    },
  },
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: env('USERS_PERMISSIONS_JWT_EXPIRES_IN', '8h'),
      },
    },
  },
  email: {
    config: {
      provider: 'sendmail',
      providerOptions: {},
      settings: {
        defaultFrom: env('SMTP_FROM', 'no-reply@example.com'),
        defaultReplyTo: env('SMTP_FROM', 'no-reply@example.com'),
      },
    },
  },
});

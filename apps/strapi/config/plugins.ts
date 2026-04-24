export default ({ env }: { env: any }) => ({
  'event-portal': {
    enabled: true,
    resolve: './src/plugins/event-portal',
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

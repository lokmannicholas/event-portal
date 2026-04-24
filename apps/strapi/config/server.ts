export default ({ env }: { env: any }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_FRONTEND_URL', 'http://localhost:1337'),
  app: {
    keys: env.array('APP_KEYS'),
  },
  cron: {
    enabled: true,
  },
});

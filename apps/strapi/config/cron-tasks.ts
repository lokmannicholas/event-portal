import type { Core } from '@strapi/strapi';
const fs = require('fs') as typeof import('fs');
const path = require('path') as typeof import('path');

const jobsModulePath =
  [
    path.resolve(__dirname, '..', 'src', 'plugins', 'event-portal', 'server', 'dist', 'utils', 'jobs'),
    path.resolve(__dirname, '..', '..', 'src', 'plugins', 'event-portal', 'server', 'dist', 'utils', 'jobs'),
  ].find((candidate) => fs.existsSync(candidate) || fs.existsSync(`${candidate}.js`)) ??
  '';

function loadJobsModule() {
  if (!jobsModulePath) {
    return null;
  }

  try {
    return require(jobsModulePath) as {
      expireActiveHolds: (strapi: Core.Strapi) => Promise<void>;
      sendUpcomingReminders: (strapi: Core.Strapi) => Promise<void>;
      syncEventStatuses: (strapi: Core.Strapi) => Promise<void>;
    };
  } catch (error) {
    console.warn(`[cron-tasks] Unable to load jobs module from ${jobsModulePath}:`, error);
    return null;
  }
}

const jobs = loadJobsModule();

const disabledCronTasks = {};

const enabledCronTasks = {
  '*/1 * * * *': async ({ strapi }: { strapi: Core.Strapi }) => {
    await jobs?.expireActiveHolds(strapi);
    await jobs?.syncEventStatuses(strapi);
  },
  '0 * * * *': async ({ strapi }: { strapi: Core.Strapi }) => {
    await jobs?.sendUpcomingReminders(strapi);
  },
};

export default jobs ? enabledCronTasks : disabledCronTasks;

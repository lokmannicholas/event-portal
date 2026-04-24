# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base
RUN corepack enable
WORKDIR /workspace

FROM base AS deps
COPY package.json .yarnrc.yml tsconfig.base.json ./
COPY types ./types
COPY apps/strapi/package.json ./apps/strapi/package.json
RUN yarn install

FROM deps AS builder
COPY apps/strapi ./apps/strapi
RUN yarn workspace @flu-vax/cms build

FROM base AS runner
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/apps/strapi/node_modules ./apps/strapi/node_modules
COPY --from=builder /workspace/package.json ./package.json
COPY --from=builder /workspace/.yarnrc.yml ./.yarnrc.yml
COPY --from=builder /workspace/tsconfig.base.json ./tsconfig.base.json
COPY --from=builder /workspace/types ./types
COPY --from=builder /workspace/apps/strapi ./apps/strapi
WORKDIR /workspace/apps/strapi
EXPOSE 1337
CMD ["yarn", "strapi", "start"]

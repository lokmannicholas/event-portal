# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /workspace

FROM base AS deps
COPY package.json .yarnrc.yml tsconfig.base.json ./
COPY types ./types
COPY apps/event-portal/package.json ./apps/event-portal/package.json
RUN yarn install

FROM deps AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY apps/event-portal ./apps/event-portal
RUN yarn workspace @flu-vax/event-portal build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/apps/event-portal/node_modules ./apps/event-portal/node_modules
COPY --from=builder /workspace/package.json ./package.json
COPY --from=builder /workspace/.yarnrc.yml ./.yarnrc.yml
COPY --from=builder /workspace/tsconfig.base.json ./tsconfig.base.json
COPY --from=builder /workspace/types ./types
COPY --from=builder /workspace/apps/event-portal ./apps/event-portal
WORKDIR /workspace/apps/event-portal
EXPOSE 3000
CMD ["yarn", "next", "start", "--hostname", "0.0.0.0", "--port", "3000"]

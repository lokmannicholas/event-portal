# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /workspace

FROM base AS deps
COPY package.json .yarnrc.yml tsconfig.base.json ./
COPY types ./types
COPY apps/eap/package.json ./apps/eap/package.json
RUN yarn install

FROM deps AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY apps/eap ./apps/eap
RUN yarn workspace @flu-vax/eap build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/apps/eap/node_modules ./apps/eap/node_modules
COPY --from=builder /workspace/package.json ./package.json
COPY --from=builder /workspace/.yarnrc.yml ./.yarnrc.yml
COPY --from=builder /workspace/tsconfig.base.json ./tsconfig.base.json
COPY --from=builder /workspace/types ./types
COPY --from=builder /workspace/apps/eap ./apps/eap
WORKDIR /workspace/apps/eap
EXPOSE 3000
CMD ["yarn", "next", "start", "--hostname", "0.0.0.0", "--port", "3000"]

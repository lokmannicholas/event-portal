# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base
RUN corepack enable && corepack prepare yarn@1.22.22 --activate
WORKDIR /app

FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --frozen-lockfile

FROM deps AS builder
ENV NODE_ENV=production
COPY . .
RUN yarn build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/yarn.lock ./yarn.lock
COPY --from=deps /app/.yarnrc.yml ./.yarnrc.yml
COPY --from=builder /app/config ./config
COPY --from=builder /app/database ./database
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.strapi ./.strapi
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src ./src
COPY --from=builder /app/types ./types
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/tsconfig.scripts.json ./tsconfig.scripts.json
COPY --from=builder /app/.strapi-updater.json ./.strapi-updater.json
EXPOSE 1337
CMD ["yarn", "start"]

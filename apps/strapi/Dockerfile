# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base
RUN corepack enable && corepack prepare yarn@4.2.1 --activate
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN printf 'nodeLinker: node-modules\n' > .yarnrc.yml
RUN yarn install

FROM deps AS builder
ENV NODE_ENV=production
COPY . .
RUN yarn build

FROM base AS runner
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/.yarnrc.yml ./.yarnrc.yml
COPY --from=builder /app ./
EXPOSE 1337
CMD ["yarn", "start"]

# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare yarn@4.2.1 --activate
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN printf 'nodeLinker: node-modules\n' > .yarnrc.yml
RUN yarn install

FROM deps AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN yarn build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/static ./apps/event-portal/.next/static
EXPOSE 3000
CMD ["sh", "-c", "node server.js || node apps/event-portal/server.js"]

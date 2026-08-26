# STAGE 1: Builder
FROM node:26-alpine AS builder

WORKDIR /app

# Copy monorepo root config
COPY package.json package-lock.json* ./
COPY turbo.json ./

# Copy workspace package.json files
COPY src/web/package.json ./src/web/
COPY src/shared/package.json ./src/shared/

# Install dependencies
RUN npm install

# Copy source code
COPY src/web ./src/web
COPY src/shared ./src/shared

# Build Next.js
WORKDIR /app/src/web
ENV NEXT_TELEMETRY_DISABLED=1
# Selects output:'standalone' in next.config.js — the runner stage below copies
# .next/standalone and runs server.js, which only exist in standalone mode.
ENV STYX_DOCKER_BUILD=true
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WEB_URL
ARG NEXT_PUBLIC_STYX_ENV_LABEL
ARG NEXT_PUBLIC_STYX_TEST_MONEY_MODE
ARG NEXT_PUBLIC_STYX_FEATURE_B2B_HR_UI
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WEB_URL=${NEXT_PUBLIC_WEB_URL}
ENV NEXT_PUBLIC_STYX_ENV_LABEL=${NEXT_PUBLIC_STYX_ENV_LABEL}
ENV NEXT_PUBLIC_STYX_TEST_MONEY_MODE=${NEXT_PUBLIC_STYX_TEST_MONEY_MODE}
ENV NEXT_PUBLIC_STYX_FEATURE_B2B_HR_UI=${NEXT_PUBLIC_STYX_FEATURE_B2B_HR_UI}
RUN test -n "$NEXT_PUBLIC_API_URL"
RUN npm run build

# STAGE 2: Runner
FROM node:26-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

# Copy built output and dependencies
COPY --from=builder /app/src/web/.next/standalone ./
COPY --from=builder /app/src/web/.next/static ./src/web/.next/static
COPY --from=builder /app/src/web/public ./src/web/public

ARG WEB_CONTAINER_PORT
EXPOSE ${WEB_CONTAINER_PORT}

CMD ["node", "src/web/server.js"]

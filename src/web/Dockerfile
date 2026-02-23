# STAGE 1: Builder
FROM node:20-alpine AS builder

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
RUN npm run build

# STAGE 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built output and dependencies
COPY --from=builder /app/src/web/.next/standalone ./
COPY --from=builder /app/src/web/.next/static ./src/web/.next/static
COPY --from=builder /app/src/web/public ./src/web/public

EXPOSE 3000

CMD ["node", "src/web/server.js"]

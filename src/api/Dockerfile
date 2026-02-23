# STAGE 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy the monorepo package configs
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY turbo.json ./

# Copy the API workspace package.json 
# (Assuming standard turborepo, but we need the specific api dependencies)
COPY src/api/package.json ./src/api/
COPY src/shared/package.json ./src/shared/

# Install dependencies (using npm for now as per previous commands)
RUN npm install

# Copy source code
COPY src/api ./src/api
COPY src/shared ./src/shared

# Build the API project
WORKDIR /app/src/api
RUN npm run build

# STAGE 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Set node env
ENV NODE_ENV production

# Copy compiled output and package.json from builder
COPY --from=builder /app/src/api/dist ./dist
COPY --from=builder /app/src/api/package.json ./

# Install ONLY production dependencies to keep the image slim
RUN npm install --omit=dev

# Run as non-root for security
USER node

# Expose standard NestJS port
EXPOSE 3000

# Ensure graceful shutdown
STOPSIGNAL SIGTERM

# Start the server
CMD ["node", "dist/api/src/main.js"]

# Base Node image
FROM node:26-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY src/api/package.json ./src/api/
COPY src/shared/package.json ./src/shared/
RUN npm ci --workspace=@styx/api --workspace=@styx/shared --include-workspace-root

# Copy source
COPY . .

# Build shared + API
RUN npx turbo run build --filter=@styx/api

ARG API_CONTAINER_PORT
EXPOSE ${API_CONTAINER_PORT}

# Start command (override in docker-compose)
CMD ["node", "src/api/dist/main.js"]

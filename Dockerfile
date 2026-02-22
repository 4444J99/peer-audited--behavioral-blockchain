# Base Node image
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
COPY src/api/package.json ./src/api/
RUN yarn install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN yarn build

# Expose API port
EXPOSE 3000

# Start command (override in docker-compose)
CMD ["node", "src/api/dist/main.js"]

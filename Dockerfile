# Multi-stage lightweight Node.js container
FROM node:24-alpine AS base

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY server/ ./server/
COPY client/ ./client/
COPY STATE.json ./
COPY README.md ./

# Create data and backup directory with proper permissions
RUN mkdir -p /app/data/backups && chown -R node:node /app

USER node
ENV PORT=4000
ENV NODE_ENV=production

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "server/index.js"]

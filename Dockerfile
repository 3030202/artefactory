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

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["node", "server/index.js"]

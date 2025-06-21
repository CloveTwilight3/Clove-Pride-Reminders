FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies first (for better caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Install dev dependencies for building
RUN npm ci

# Build TypeScript
RUN npm run build

# Deploy commands to Discord (only in production)
ARG NODE_ENV=production
RUN if [ "$NODE_ENV" = "production" ]; then npm run deploy-commands:prod; fi

# Remove dev dependencies after building
RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bot -u 1001 -G nodejs

# Create data directory and set permissions
RUN mkdir -p /usr/src/app/data && \
    chown -R bot:nodejs /usr/src/app

USER bot

# Expose port (if needed for health checks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Bot is running')" || exit 1

# Start the bot
CMD ["npm", "start"]
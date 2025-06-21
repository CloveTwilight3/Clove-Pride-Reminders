FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Create non-root user first
RUN addgroup -g 1001 -S nodejs && \
    adduser -S pridebot -u 1001 -G nodejs

# Install app dependencies (including dev dependencies for building)
COPY package*.json ./
COPY tsconfig*.json ./
RUN npm install
RUN npm ci

# Copy app source
COPY . .

# Build TypeScript
RUN npm run build

# Deploy commands to Discord (global commands)
RUN npm run deploy-commands:prod

# Remove dev dependencies after building
RUN npm prune --production

# Create data directory for persistent storage
RUN mkdir -p data && \
    chown -R pridebot:nodejs data

# Change ownership of the app directory
RUN chown -R pridebot:nodejs /usr/src/app

# Switch to non-root user
USER pridebot

# Expose port for health checks
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Pride Bot is running'); process.exit(0)" || exit 1

# Start the bot
CMD ["npm", "start"]
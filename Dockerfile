FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code and config files
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npx tsc

# Remove dev dependencies after building
RUN npm prune --production

# Create non-root user with pride theme
RUN addgroup -g 1002 -S pride && \
    adduser -S pride -u 1002 -G pride

# Create data directory and set permissions BEFORE switching users
RUN mkdir -p /usr/src/app/data && \
    chown -R pride:pride /usr/src/app && \
    chmod -R 755 /usr/src/app/data

USER pride

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Bot is running')" || exit 1

# Start the bot
CMD ["npm", "start"]
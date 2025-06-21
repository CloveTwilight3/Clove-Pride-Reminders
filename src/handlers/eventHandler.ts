import { Client } from 'discord.js';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger';

export const loadEvents = (client: Client): void => {
  const eventsPath = join(__dirname, '../events');
  
  if (!existsSync(eventsPath)) {
    logger.warn('Events directory not found');
    return;
  }
  
  const eventFiles = readdirSync(eventsPath).filter(file => 
    (file.endsWith('.js') || file.endsWith('.ts')) && !file.endsWith('.d.ts')
  );

  for (const file of eventFiles) {
    const filePath = join(eventsPath, file);
    const event = require(filePath).default;

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    
    logger.info(`Loaded event: ${event.name}`);
  }
};
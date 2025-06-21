import { Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { Command } from '../interfaces/Command';
import { logger } from '../utils/logger';

export const loadCommands = async (): Promise<Collection<string, Command>> => {
  const commands = new Collection<string, Command>();
  const commandsPath = join(__dirname, '../commands');
  
  if (!require('fs').existsSync(commandsPath)) {
    logger.warn('Commands directory not found');
    return commands;
  }
  
  const commandFiles = readdirSync(commandsPath).filter(file => 
    (file.endsWith('.js') || file.endsWith('.ts')) && !file.endsWith('.d.ts')
  );
  
  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    
    try {
      const command: Command = require(filePath).default;
      
      if ('data' in command && 'execute' in command) {
        commands.set(command.data.name, command);
        logger.info(`Loaded command: ${command.data.name}`);
      } else {
        logger.warn(`Command at ${filePath} is missing required "data" or "execute" property`);
      }
    } catch (error) {
      logger.error(`Error loading command at ${filePath}: ${error}`);
    }
  }
  
  logger.info(`Successfully loaded ${commands.size} commands`);
  return commands;
};
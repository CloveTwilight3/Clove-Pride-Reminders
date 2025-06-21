import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { logger } from './logger';

const SETTINGS_FILE = join(process.cwd(), 'data', 'server-settings.json');

export interface ServerSettings {
  guildId: string;
  prideRemindersEnabled: boolean;
  prideChannelId?: string;
  prideRoleId?: string;
  updatedAt: string;
}

// Ensure data directory exists
const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  logger.info(`Created data directory: ${dataDir}`);
}

function readSettingsData(): Record<string, ServerSettings> {
  try {
    logger.debug(`Attempting to read settings from: ${SETTINGS_FILE}`);
    
    if (!existsSync(SETTINGS_FILE)) {
      logger.info('Settings file does not exist, creating empty settings file');
      writeFileSync(SETTINGS_FILE, JSON.stringify({}, null, 2));
      return {};
    }
    
    const data = readFileSync(SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    logger.debug(`Successfully read settings: ${JSON.stringify(parsed)}`);
    return parsed;
  } catch (error) {
    logger.error(`Error reading server settings: ${error}`);
    return {};
  }
}

function writeSettingsData(settings: Record<string, ServerSettings>): void {
  try {
    logger.debug(`Attempting to write settings to: ${SETTINGS_FILE}`);
    logger.debug(`Settings data: ${JSON.stringify(settings, null, 2)}`);
    
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    logger.info(`Successfully wrote settings to file`);
  } catch (error) {
    logger.error(`Error writing server settings: ${error}`);
  }
}

export function getServerSettings(guildId: string): ServerSettings {
  logger.debug(`Getting settings for guild: ${guildId}`);
  const allSettings = readSettingsData();
  
  const settings = allSettings[guildId] || {
    guildId,
    prideRemindersEnabled: false,
    updatedAt: new Date().toISOString()
  };
  
  logger.debug(`Retrieved settings for guild ${guildId}: ${JSON.stringify(settings)}`);
  return settings;
}

export function updateServerSettings(guildId: string, updates: Partial<ServerSettings>): void {
  logger.debug(`Updating settings for guild ${guildId} with: ${JSON.stringify(updates)}`);
  
  const allSettings = readSettingsData();
  
  const currentSettings = allSettings[guildId] || {
    guildId,
    prideRemindersEnabled: false,
    updatedAt: new Date().toISOString()
  };
  
  allSettings[guildId] = {
    ...currentSettings,
    ...updates,
    guildId, // Ensure guildId is always set
    updatedAt: new Date().toISOString()
  };
  
  logger.debug(`New settings for guild ${guildId}: ${JSON.stringify(allSettings[guildId])}`);
  
  writeSettingsData(allSettings);
  logger.info(`Updated settings for guild ${guildId}`);
}

export function getAllServerSettings(): Record<string, ServerSettings> {
  return readSettingsData();
}
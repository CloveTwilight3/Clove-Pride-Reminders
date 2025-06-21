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
}

function readSettingsData(): Record<string, ServerSettings> {
  try {
    if (!existsSync(SETTINGS_FILE)) {
      writeFileSync(SETTINGS_FILE, JSON.stringify({}, null, 2));
      return {};
    }
    
    const data = readFileSync(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Error reading server settings: ${error}`);
    return {};
  }
}

function writeSettingsData(settings: Record<string, ServerSettings>): void {
  try {
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (error) {
    logger.error(`Error writing server settings: ${error}`);
  }
}

export function getServerSettings(guildId: string): ServerSettings {
  const allSettings = readSettingsData();
  
  return allSettings[guildId] || {
    guildId,
    prideRemindersEnabled: false,
    updatedAt: new Date().toISOString()
  };
}

export function updateServerSettings(guildId: string, updates: Partial<ServerSettings>): void {
  const allSettings = readSettingsData();
  
  allSettings[guildId] = {
    ...allSettings[guildId],
    guildId,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  writeSettingsData(allSettings);
  logger.info(`Updated settings for guild ${guildId}`);
}

export function getAllServerSettings(): Record<string, ServerSettings> {
  return readSettingsData();
}
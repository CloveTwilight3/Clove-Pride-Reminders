import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { loadCommands } from './handlers/commandHandler';
import { validateEnv } from './utils/validateEnv';
import { logger } from './utils/logger';
import { Command } from './interfaces/Command';

config();

if (!validateEnv()) {
  process.exit(1);
}

async function deployCommands() {
  try {
    logger.info('🔄 Starting command deployment...');

    const commands = await loadCommands();
    const commandData = commands.map((command: Command) => command.data.toJSON());

    logger.info(`📝 Found ${commandData.length} commands to deploy`);

    const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID!),
      { body: commandData }
    ) as any[];
    
    logger.info(`✅ Successfully deployed ${data.length} global commands.`);

  } catch (error) {
    logger.error(`❌ Error deploying commands: ${error}`);
    process.exit(1);
  }
}

deployCommands();
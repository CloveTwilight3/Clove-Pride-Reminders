import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from 'dotenv';
import { validateEnv } from './utils/validateEnv';
import { logger } from './utils/logger';
import { loadCommands } from './handlers/commandHandler';
import { loadEvents } from './handlers/eventHandler';
import { Command } from './interfaces/Command';
import { REST, Routes } from 'discord.js';
import { PrideReminderService } from './services/prideReminderService';

config();

if (!validateEnv()) {
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ],
  allowedMentions: {
    parse: ['users', 'roles'],
    repliedUser: true
  }
}) as Client & { commands: Collection<string, Command> };

client.commands = new Collection();

let prideReminderService: PrideReminderService;

async function deployCommands(commands: Collection<string, Command>) {
  try {
    logger.info('🔄 Started refreshing application (/) commands.');
    
    const commandData = commands.map((command: Command) => command.data.toJSON());
    const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID!),
      { body: commandData }
    ) as any[];
    
    logger.info(`✅ Successfully reloaded ${data.length} global commands.`);
  } catch (error) {
    logger.error(`❌ Error deploying commands: ${error}`);
    throw error;
  }
}

async function initializeBot() {
  try {
    logger.info('🚀 Starting Clove\'s Pride Reminders...');
    
    client.commands = await loadCommands();
    await deployCommands(client.commands);
    loadEvents(client);
    
    await client.login(process.env.DISCORD_TOKEN);
    
    client.once('ready', () => {
      logger.info(`✅ ${client.user!.tag} is online and ready!`);
      logger.info(`🏳️‍🌈 Serving ${client.guilds.cache.size} servers with pride reminders`);

      prideReminderService = new PrideReminderService(client);
      prideReminderService.start();
      
      client.user!.setActivity('Pride Events 🏳️‍🌈', { type: 3 }); // Watching
    });
    
  } catch (error) {
    logger.error(`Failed to initialize bot: ${error}`);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  if (prideReminderService) {
    prideReminderService.stop();
  }
  client.destroy();
  process.exit(0);
});

initializeBot();
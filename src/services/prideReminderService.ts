import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import * as cron from 'node-cron';
import { 
  getEventsNeedingNotification, 
  getEventsNeedingReminder,
  markEventNotified,
  markEventReminded,
  PrideEvent
} from '../utils/prideEventManager';
import { getAllServerSettings } from '../utils/serverSettingsManager';
import { logger } from '../utils/logger';

export class PrideReminderService {
  private client: Client;
  private cronJob: cron.ScheduledTask | null = null;

  constructor(client: Client) {
    this.client = client;
  }

  start(): void {
    // Check for pride events every 30 minutes
    this.cronJob = cron.schedule('*/30 * * * *', () => {
      this.checkPrideEvents();
    }, { scheduled: false });

    this.cronJob.start();
    logger.info('Pride Reminder Service started - checking every 30 minutes');
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Pride Reminder Service stopped');
    }
  }

  private async checkPrideEvents(): Promise<void> {
    try {
      // Check for events needing 24h reminders
      const eventsNeedingReminder = getEventsNeedingReminder();
      for (const event of eventsNeedingReminder) {
        await this.sendEventReminder(event);
        markEventReminded(event.id);
      }

      // Check for events needing immediate notifications
      const eventsNeedingNotification = getEventsNeedingNotification();
      for (const event of eventsNeedingNotification) {
        await this.sendEventNotification(event);
        markEventNotified(event.id);
      }

    } catch (error) {
      logger.error(`Error checking pride events: ${error}`);
    }
  }

  private async sendEventReminder(event: PrideEvent): Promise<void> {
    const allSettings = getAllServerSettings();
    
    for (const [guildId, settings] of Object.entries(allSettings)) {
      if (!settings.prideRemindersEnabled || !settings.prideChannelId) {
        continue;
      }

      try {
        const channel = await this.client.channels.fetch(settings.prideChannelId) as TextChannel;
        if (!channel?.isTextBased()) continue;

        const eventDate = new Date(event.date);
        
        const embed = new EmbedBuilder()
          .setTitle('🏳️‍🌈 Pride Event Reminder!')
          .setDescription(`**${event.title}** is coming up tomorrow!`)
          .addFields(
            { name: '📝 Description', value: event.description, inline: false },
            { name: '🗓️ When', value: `<t:${Math.floor(eventDate.getTime() / 1000)}:F>`, inline: true }
          )
          .setColor(0xFF69B4)
          .setFooter({ text: '🏳️‍🌈 24 Hour Reminder' })
          .setTimestamp();

        if (event.location) {
          embed.addFields({ name: '📍 Location', value: event.location, inline: true });
        }

        let content = `🏳️‍🌈 **Pride Event Reminder!** Don't forget about **${event.title}** tomorrow!`;
        
        if (settings.prideRoleId) {
          content += ` <@&${settings.prideRoleId}>`;
        }

        await channel.send({ 
          content, 
          embeds: [embed],
          allowedMentions: {
            roles: settings.prideRoleId ? [settings.prideRoleId] : []
          }
        });
        
        logger.info(`Sent 24h reminder for pride event: ${event.title} to guild ${guildId}`);

      } catch (error) {
        logger.error(`Error sending pride event reminder to guild ${guildId}: ${error}`);
      }
    }
  }

  private async sendEventNotification(event: PrideEvent): Promise<void> {
    const allSettings = getAllServerSettings();
    
    for (const [guildId, settings] of Object.entries(allSettings)) {
      if (!settings.prideRemindersEnabled || !settings.prideChannelId) {
        continue;
      }

      try {
        const channel = await this.client.channels.fetch(settings.prideChannelId) as TextChannel;
        if (!channel?.isTextBased()) continue;

        const eventDate = new Date(event.date);
        
        const embed = new EmbedBuilder()
          .setTitle('🏳️‍🌈 Pride Event Starting Soon!')
          .setDescription(`**${event.title}** is starting soon!`)
          .addFields(
            { name: '📝 Description', value: event.description, inline: false },
            { name: '🗓️ When', value: `<t:${Math.floor(eventDate.getTime() / 1000)}:F>`, inline: true }
          )
          .setColor(0xFF69B4)
          .setFooter({ text: '🏳️‍🌈 Starting Soon!' })
          .setTimestamp();

        if (event.location) {
          embed.addFields({ name: '📍 Location', value: event.location, inline: true });
        }

        let content = `🏳️‍🌈 **Pride Event Alert!** **${event.title}** is starting soon!`;
        
        if (settings.prideRoleId) {
          content += ` <@&${settings.prideRoleId}>`;
        }

        await channel.send({ 
          content, 
          embeds: [embed],
          allowedMentions: {
            roles: settings.prideRoleId ? [settings.prideRoleId] : []
          }
        });
        
        logger.info(`Sent notification for pride event: ${event.title} to guild ${guildId}`);

      } catch (error) {
        logger.error(`Error sending pride event notification to guild ${guildId}: ${error}`);
      }
    }
  }
}
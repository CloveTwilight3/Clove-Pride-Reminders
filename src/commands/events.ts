import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  PermissionFlagsBits
} from 'discord.js';
import { Command } from '../interfaces/Command';
import { 
  addGlobalPrideEvent,
  removeGlobalPrideEvent,
  getUpcomingGlobalEvents,
  PrideEvent
} from '../utils/prideEventManager';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('events')
    .setDescription('Manage global pride events (Bot Admin only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a global pride event')
        .addStringOption(option =>
          option
            .setName('title')
            .setDescription('Event title')
            .setRequired(true)
            .setMaxLength(100)
        )
        .addStringOption(option =>
          option
            .setName('date')
            .setDescription('Event date (YYYY-MM-DD HH:MM or YYYY-MM-DD)')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('description')
            .setDescription('Event description')
            .setRequired(true)
            .setMaxLength(1000)
        )
        .addStringOption(option =>
          option
            .setName('tags')
            .setDescription('Event tags (comma-separated)')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('location')
            .setDescription('Event location')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('organizer')
            .setDescription('Event organizer')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('url')
            .setDescription('Event URL')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List upcoming global pride events')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a global pride event')
        .addStringOption(option =>
          option
            .setName('event-id')
            .setDescription('Event ID to remove')
            .setRequired(true)
        )
    ),
  
  async execute(interaction: ChatInputCommandInteraction) {
    // Check if user is bot admin (replace with your user IDs)
    const BOT_ADMINS = ['1025770042245251122']; // Replace with admin user IDs
    
    if (!BOT_ADMINS.includes(interaction.user.id)) {
      await interaction.reply({
        content: '❌ Only bot administrators can manage global events.',
        ephemeral: true
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case 'add':
        await handleAddEvent(interaction);
        break;
      case 'list':
        await handleListEvents(interaction);
        break;
      case 'remove':
        await handleRemoveEvent(interaction);
        break;
    }
  }
};

async function handleAddEvent(interaction: ChatInputCommandInteraction) {
  const title = interaction.options.getString('title', true);
  const dateString = interaction.options.getString('date', true);
  const description = interaction.options.getString('description', true);
  const tagsString = interaction.options.getString('tags') || 'general';
  const location = interaction.options.getString('location');
  const organizer = interaction.options.getString('organizer');
  const url = interaction.options.getString('url');
  
  // Parse date
  let eventDate: Date;
  try {
    eventDate = dateString.includes(' ') ? 
      new Date(dateString) : 
      new Date(dateString + ' 12:00');
    
    if (isNaN(eventDate.getTime()) || eventDate < new Date()) {
      throw new Error('Invalid date');
    }
  } catch {
    await interaction.reply({
      content: '❌ Invalid date format! Use YYYY-MM-DD or YYYY-MM-DD HH:MM',
      ephemeral: true
    });
    return;
  }
  
  const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  
  const eventId = addGlobalPrideEvent({
    title,
    description,
    date: eventDate.toISOString(),
    location: location || undefined,
    organizer: organizer || undefined,
    url: url || undefined,
    tags,
    createdBy: interaction.user.id
  });
  
  const embed = new EmbedBuilder()
    .setTitle('🏳️‍🌈 Global Pride Event Added!')
    .addFields(
      { name: '📅 Event', value: title, inline: false },
      { name: '🗓️ Date', value: `<t:${Math.floor(eventDate.getTime() / 1000)}:F>`, inline: true },
      { name: '🆔 Event ID', value: eventId, inline: true }
    )
    .setColor(0xFF69B4)
    .setTimestamp();
  
  await interaction.reply({ embeds: [embed] });
}

async function handleListEvents(interaction: ChatInputCommandInteraction) {
  const events = getUpcomingGlobalEvents(30);
  
  if (events.length === 0) {
    await interaction.reply({
      content: '📋 No upcoming global pride events.',
      ephemeral: true
    });
    return;
  }
  
  const embed = new EmbedBuilder()
    .setTitle('🏳️‍🌈 Upcoming Global Pride Events')
    .setDescription(`Found ${events.length} upcoming event(s)`)
    .setColor(0xFF69B4)
    .setTimestamp();
  
  events.slice(0, 10).forEach((event: PrideEvent) => {
    const eventDate = new Date(event.date);
    embed.addFields({
      name: event.title,
      value: `**Date:** <t:${Math.floor(eventDate.getTime() / 1000)}:F>\n**ID:** \`${event.id}\``,
      inline: true
    });
  });
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleRemoveEvent(interaction: ChatInputCommandInteraction) {
  const eventId = interaction.options.getString('event-id', true);
  
  const success = removeGlobalPrideEvent(eventId);
  
  if (success) {
    await interaction.reply('✅ Successfully removed the global pride event.');
  } else {
    await interaction.reply({
      content: '❌ Event not found.',
      ephemeral: true
    });
  }
}

export default command;
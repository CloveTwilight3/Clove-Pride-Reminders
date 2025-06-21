import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType
} from 'discord.js';
import { Command } from '../interfaces/Command';
import { updateServerSettings, getServerSettings } from '../utils/serverSettingsManager';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure pride reminders for this server')
    .addSubcommand(subcommand =>
      subcommand
        .setName('channel')
        .setDescription('Set the channel for pride event reminders')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel to send pride reminders')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('role')
        .setDescription('Set the role to ping for pride reminders')
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('Role to ping (optional)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Enable or disable pride reminders')
        .addBooleanOption(option =>
          option
            .setName('enabled')
            .setDescription('Enable pride reminders')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Show current pride reminder settings')
    ),
  
  permissions: [PermissionFlagsBits.ManageGuild],
  
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: '❌ This command can only be used in servers!',
        ephemeral: true
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    
    try {
      switch (subcommand) {
        case 'channel':
          await handleSetChannel(interaction, guildId);
          break;
        case 'role':
          await handleSetRole(interaction, guildId);
          break;
        case 'toggle':
          await handleToggle(interaction, guildId);
          break;
        case 'status':
          await handleStatus(interaction, guildId);
          break;
      }
    } catch (error) {
      console.error('Error in setup command:', error);
      await interaction.reply({
        content: '❌ An error occurred while processing the command.',
        ephemeral: true
      });
    }
  }
};

async function handleSetChannel(interaction: ChatInputCommandInteraction, guildId: string) {
  const channel = interaction.options.getChannel('channel', true);
  
  updateServerSettings(guildId, { prideChannelId: channel.id });
  
  await interaction.reply({
    content: `✅ Pride reminders will now be sent to ${channel}!`,
    ephemeral: true
  });
}

async function handleSetRole(interaction: ChatInputCommandInteraction, guildId: string) {
  const role = interaction.options.getRole('role');
  
  updateServerSettings(guildId, { 
    prideRoleId: role?.id || undefined 
  });
  
  if (role) {
    await interaction.reply({
      content: `✅ Pride reminders will now ping ${role}!`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `✅ Pride reminders will no longer ping any role.`,
      ephemeral: true
    });
  }
}

async function handleToggle(interaction: ChatInputCommandInteraction, guildId: string) {
  const enabled = interaction.options.getBoolean('enabled', true);
  
  updateServerSettings(guildId, { prideRemindersEnabled: enabled });
  
  await interaction.reply({
    content: `✅ Pride reminders have been ${enabled ? 'enabled' : 'disabled'}!`,
    ephemeral: true
  });
}

async function handleStatus(interaction: ChatInputCommandInteraction, guildId: string) {
  const settings = getServerSettings(guildId);
  
  const embed = new EmbedBuilder()
    .setTitle('🏳️‍🌈 Pride Reminder Settings')
    .addFields(
      { 
        name: '📊 Status', 
        value: settings.prideRemindersEnabled ? '✅ Enabled' : '❌ Disabled', 
        inline: true 
      },
      { 
        name: '📢 Channel', 
        value: settings.prideChannelId ? `<#${settings.prideChannelId}>` : '❌ Not Set', 
        inline: true 
      },
      { 
        name: '🔔 Role', 
        value: settings.prideRoleId ? `<@&${settings.prideRoleId}>` : '❌ None', 
        inline: true 
      }
    )
    .setColor(0xFF69B4)
    .setFooter({ 
      text: 'Use /setup channel, /setup role, or /setup toggle to configure' 
    })
    .setTimestamp();
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export default command;
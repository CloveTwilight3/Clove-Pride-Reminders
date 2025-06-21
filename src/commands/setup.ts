async function handleSetChannel(interaction: ChatInputCommandInteraction, guildId: string) {
  const channel = interaction.options.getChannel('channel', true);
  
  updateServerSettings(guildId, { prideChannelId: channel.id });
  
  await interaction.reply({
    content: `✅ Pride reminders will now be sent to ${channel}!`,
    flags: 64 // MessageFlags.Ephemeral
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
      flags: 64
    });
  } else {
    await interaction.reply({
      content: `✅ Pride reminders will no longer ping any role.`,
      flags: 64
    });
  }
}

async function handleToggle(interaction: ChatInputCommandInteraction, guildId: string) {
  const enabled = interaction.options.getBoolean('enabled', true);
  
  updateServerSettings(guildId, { prideRemindersEnabled: enabled });
  
  await interaction.reply({
    content: `✅ Pride reminders have been ${enabled ? 'enabled' : 'disabled'}!`,
    flags: 64
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
  
  await interaction.reply({ embeds: [embed], flags: 64 });
}
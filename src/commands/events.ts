async function handleAddEvent(interaction: ChatInputCommandInteraction) {
  const title = interaction.options.getString('title', true);
  const dateString = interaction.options.getString('date', true);
  const description = interaction.options.getString('description', true);
  const tagsString = interaction.options.getString('tags') || 'general';
  const location = interaction.options.getString('location');
  const organizer = interaction.options.getString('organizer');
  const url = interaction.options.getString('url');
  
  // Parse date with better error handling
  let eventDate: Date;
  try {
    // Handle different date formats
    let dateToParse = dateString.trim();
    
    // If only date provided (YYYY-MM-DD), add default time
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateToparse)) {
  dateToparse += ' 12:00:00';
}
    // If date and time without seconds (YYYY-MM-DD HH:MM), add seconds
    else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(dateToparse)) {
      dateToparse += ':00';
    }
    
    eventDate = new Date(dateToparse);
    
    // Validate the date
    if (isNaN(eventDate.getTime())) {
      throw new Error('Invalid date format');
    }
    
    // Check if date is in the past (allow same day events)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    
    if (eventDay < today) {
      throw new Error('Event date cannot be in the past');
    }
    
  } catch (error) {
    await interaction.reply({
      content: `❌ Invalid date format! Please use one of these formats:
- \`2025-06-21\` (date only, defaults to 12:00 PM)
- \`2025-06-21 14:30\` (date and time)
- \`2025-06-21 14:30:00\` (date, time, and seconds)

Example: \`2025-06-21\` or \`2025-06-21 19:00\``,
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
      { name: '📝 Description', value: description.length > 100 ? description.substring(0, 100) + '...' : description, inline: false },
      { name: '🗓️ Date', value: `<t:${Math.floor(eventDate.getTime() / 1000)}:F>`, inline: true },
      { name: '⏰ Time Until', value: `<t:${Math.floor(eventDate.getTime() / 1000)}:R>`, inline: true },
      { name: '🆔 Event ID', value: `\`${eventId}\``, inline: true }
    )
    .setColor(0xFF69B4)
    .setTimestamp();
  
  if (location) {
    embed.addFields({ name: '📍 Location', value: location, inline: true });
  }
  
  if (organizer) {
    embed.addFields({ name: '👥 Organizer', value: organizer, inline: true });
  }
  
  if (tags.length > 0) {
    embed.addFields({ name: '🏷️ Tags', value: tags.join(', '), inline: true });
  }
  
  if (url) {
    embed.addFields({ name: '🔗 More Info', value: url, inline: false });
  }
  
  await interaction.reply({ embeds: [embed] });
}
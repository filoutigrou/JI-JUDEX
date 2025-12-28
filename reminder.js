const { EmbedBuilder } = require('discord.js');

function scheduleReminder(client) {
  // Exécute la tâche toutes les 48 heures (en millisecondes)
  setInterval(async () => {
    const channelId = process.env.REMINDER_CHANNEL_ID;
    const message = process.env.REMINDER_MESSAGE;

    if (!channelId || !message) {
      console.error('REMINDER_CHANNEL_ID ou REMINDER_MESSAGE ne sont pas définis dans le .env');
      return;
    }

    try {
      const channel = await client.channels.fetch(channelId);
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor(0x0099FF)
          .setTitle('Rappel Automatique')
          .setDescription(message)
          .setTimestamp();
        await channel.send({ embeds: [embed] });
        console.log(`Message de rappel envoyé au salon ${channelId}`);
      } else {
        console.error(`Salon de rappel avec l'ID ${channelId} introuvable.`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message de rappel :', error);
    }
  }, 24 * 60 * 60 * 1000); // 48 heures
}

module.exports = {
  scheduleReminder,
};

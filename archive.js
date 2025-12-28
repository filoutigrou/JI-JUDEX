// commands/archive.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { uploadToGitHub } = require('./manager.js');
const dayjs = require('dayjs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('archive')
    .setDescription('Permet d\'archives les tickets'),
  
  async execute(interaction) {
    const channel = interaction.channel;

    await interaction.deferReply({ ephemeral: true });

    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

      let content = '';
      sortedMessages.forEach(msg => {
        const timestamp = dayjs(msg.createdAt).format('YYYY-MM-DD HH:mm:ss');
        content += `[${timestamp}] ${msg.author.tag} : ${msg.content}\n`;
      });

      if (!content) content = 'Aucun message trouvé.';

      const fileName = `${channel.name}-${Date.now()}.txt`;

      await uploadToGitHub({ filePath: fileName, content });

      await interaction.editReply(`✅ Salon archivé et envoyé sur GitHub : \`${fileName}\``);
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Une erreur est survenue lors de l’archivage.');
    }
  },
};

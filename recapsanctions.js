const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const SANCTIONS_DIR = path.join(__dirname, 'sanctions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recapsanctions')
    .setDescription('Voir une sanction enregistrée'),

  async execute(interaction) {
    const files = fs.readdirSync(SANCTIONS_DIR).filter(f => f.endsWith('.json'));

    if (files.length === 0) {
      return interaction.reply({ content: '❌ Aucune sanction trouvée.', ephemeral: true });
    }

    const options = files.map(file => ({
      label: file.length > 100 ? file.slice(0, 100) : file,
      value: file
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_sanction')
      .setPlaceholder('📁 Choisis une sanction à afficher')
      .addOptions(options.slice(0, 25)); // Max 25

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: 'Sélectionne une sanction à consulter :',
      components: [row],
      ephemeral: true
    });
  },

  async handleSelect(interaction) {
    if (interaction.customId !== 'select_sanction') return;

    const selectedFile = interaction.values[0];
    const filePath = path.join(SANCTIONS_DIR, selectedFile);

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      const embed = new EmbedBuilder()
        .setTitle(`📋 Sanction de ${data.pseudo}`)
        .setDescription(`Fichier: \`${selectedFile}\``)
        .addFields(
          { name: 'Utilisateur', value: data.utilisateur || 'N/A', inline: true },
          { name: 'Identité RP', value: data.identite || 'N/A', inline: false },
          { name: 'Âge', value: data.age || 'N/A', inline: true },
          { name: 'Infraction', value: data.infraction || 'N/A', inline: true},
          { name: 'Grade', value: data.grade || 'N/A', inline: true },
          { name: 'Département', value: data.departement || 'N/A', inline: true },
          { name: 'Date', value: new Date(data.date).toLocaleString(), inline: false },
        )
        .setColor(0x3498db)
        .setTimestamp();

      // Ajouter une image en thumbnail si dispo
      if (data.images && data.images.length > 0) {
        const imageName = data.images[0];
        const githubRawURL = `https://raw.githubusercontent.com/filoutigrou/JI-JUDEX/main/sanctions/${imageName}`;
        embed.setThumbnail(githubRawURL);
      }

      await interaction.update({ content: '', embeds: [embed], components: [] });
    } catch (error) {
      console.error(error);
      await interaction.update({ content: '❌ Erreur lors de la lecture du fichier.', components: [] });
    }
  }
};

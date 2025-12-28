const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  PermissionFlagsBits
} = require('discord.js');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const owner = 'filoutigrou';
const repo = 'JI-JUDEX';
const branch = 'main'; // ou la branche par défaut

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recap')
    .setDescription('Affiche la liste des archives disponibles sur GitHub'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const { data: files } = await octokit.repos.getContent({
        owner,
        repo,
        path: 'archives',
        ref: branch,
      });

      if (!Array.isArray(files) || files.length === 0) {
        return interaction.editReply('📭 Aucune archive trouvée dans le dossier `archives/`.');
      }

      const options = files.slice(0, 25).map(file => ({
        label: file.name,
        description: `Voir ${file.name}`,
        value: file.path
      }));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select-archive')
        .setPlaceholder('Choisissez une archive à consulter')
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const message = await interaction.editReply({
        content: '📁 Sélectionnez une archive à consulter :',
        components: [row],
      });

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60_000,
      });

      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: '❌ Cette sélection ne t\'est pas destinée.', ephemeral: true });
        }

        const selectedPath = i.values[0];

        // Récupère le contenu brut du fichier
        const { data: fileContent } = await octokit.repos.getContent({
          owner,
          repo,
          path: selectedPath,
          ref: branch,
        });

        let contentText = '';

        if ('content' in fileContent) {
          const buff = Buffer.from(fileContent.content, 'base64');
          contentText = buff.toString('utf-8').slice(0, 1900); // Discord limite à 2000 caractères
        }

        if (!contentText) {
          return i.update({
            content: '❌ Impossible de lire le contenu du fichier.',
            components: [],
          });
        }

        await i.update({
          content: `📄 **Contenu de \`${selectedPath}\` :**\n\`\`\`\n${contentText}\n\`\`\``,
          components: [],
        });
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.editReply({
            content: '⏱️ Temps écoulé. Veuillez relancer la commande pour consulter une archive.',
            components: []
          });
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers GitHub :', error);
      await interaction.editReply('❌ Une erreur est survenue lors de la récupération des archives.');
    }
  }
};

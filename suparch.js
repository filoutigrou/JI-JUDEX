const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionFlagsBits } = require('discord.js');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const owner = 'filoutigrou';
const repo = 'NODE-E';
const branch = 'main'; // ta branche principale, à adapter si besoin

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deletearchive')
    .setDescription('Supprime une archive depuis GitHub'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // Récupérer la liste des fichiers dans /archives
      const { data: files } = await octokit.repos.getContent({
        owner,
        repo,
        path: 'archives',
        ref: branch,
      });

      if (!Array.isArray(files) || files.length === 0) {
        return interaction.editReply('📭 Aucune archive trouvée dans le dossier `archives/`.');
      }

      // Préparer les options pour le menu déroulant (max 25)
      const options = files.slice(0, 25).map(file => ({
        label: file.name,
        description: `Supprimer ${file.name}`,
        value: file.path
      }));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select-archive-delete')
        .setPlaceholder('Choisissez une archive à supprimer')
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const message = await interaction.editReply({
        content: '📁 Sélectionnez une archive à supprimer :',
        components: [row],
      });

      // Collector pour la sélection du fichier
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000,
        filter: i => i.user.id === interaction.user.id,
      });

      collector.on('collect', async i => {
        const selectedPath = i.values[0];

        // Récupérer le sha du fichier pour suppression
        const fileData = files.find(f => f.path === selectedPath);

        if (!fileData) {
          return i.reply({ content: '❌ Fichier introuvable.', ephemeral: true });
        }

        // Message de confirmation avec boutons
        const confirmRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`confirm-delete-${fileData.sha}`)
            .setLabel('Oui, supprimer')
            .setStyle(ButtonStyle.Danger),

          new ButtonBuilder()
            .setCustomId('cancel-delete')
            .setLabel('Non, annuler')
            .setStyle(ButtonStyle.Secondary)
        );

        await i.update({
          content: `⚠️ Veux-tu vraiment supprimer l'archive **${fileData.name}** ? Cette action est irréversible.`,
          components: [confirmRow],
        });

        // Création d'un nouveau collector pour les boutons de confirmation
        const buttonCollector = i.channel.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 30000,
          filter: btnInt => btnInt.user.id === interaction.user.id,
          max: 1
        });

        buttonCollector.on('collect', async btnInt => {
          if (btnInt.customId === 'cancel-delete') {
            await btnInt.update({ content: '❌ Suppression annulée.', components: [] });
            return;
          }

          if (btnInt.customId.startsWith('confirm-delete-')) {
            try {
              await octokit.repos.deleteFile({
                owner,
                repo,
                path: selectedPath,
                message: `Suppression de l'archive ${fileData.name} via bot`,
                sha: fileData.sha,
                branch,
              });

              await btnInt.update({ content: `✅ Archive **${fileData.name}** supprimée avec succès.`, components: [] });
            } catch (error) {
              console.error('Erreur suppression fichier GitHub :', error);
              await btnInt.update({ content: '❌ Une erreur est survenue lors de la suppression.', components: [] });
            }
          }
        });

        buttonCollector.on('end', collected => {
          if (collected.size === 0) {
            interaction.editReply({ content: '⏱️ Temps écoulé, suppression annulée.', components: [] });
          }
        });
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.editReply({
            content: '⏱️ Temps écoulé. Veuillez relancer la commande pour supprimer une archive.',
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

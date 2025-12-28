const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = 'filoutigrou';
const repo = 'JI-JUDEX';
const SANCTIONS_DIR = path.join(__dirname, 'sanctions');

async function deleteFileFromGitHub(filePath) {
  const githubPath = `sanctions/${path.basename(filePath)}`;

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: githubPath,
    });

    await octokit.repos.deleteFile({
      owner,
      repo,
      path: githubPath,
      message: `Suppression de ${path.basename(filePath)}`,
      sha: data.sha,
    });
  } catch (error) {
    console.error(`Erreur lors de la suppression de ${githubPath} sur GitHub :`, error.message);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('supprsanction')
    .setDescription('Supprimer une sanction et ses images associées'),

  async execute(interaction) {
    const files = fs.readdirSync(SANCTIONS_DIR).filter(f => f.endsWith('.json'));

    if (files.length === 0) {
      return interaction.reply({ content: '❌ Aucune sanction à supprimer.', ephemeral: true });
    }

    const options = files.map(file => ({
      label: file.length > 100 ? file.slice(0, 100) : file,
      value: file
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_sanction_delete')
      .setPlaceholder('Choisis une sanction à supprimer')
      .addOptions(options.slice(0, 25));

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: 'Sélectionne une sanction à supprimer :',
      components: [row],
      ephemeral: true,
    });
  },

  async handleSelect(interaction) {
    if (interaction.customId !== 'select_sanction_delete') return;

    const selectedFile = interaction.values[0];
    const filePath = path.join(SANCTIONS_DIR, selectedFile);

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // Supprimer images associées localement et sur GitHub
      if (data.images && Array.isArray(data.images)) {
        for (const img of data.images) {
          const imgPath = path.join(SANCTIONS_DIR, img);
          if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
            await deleteFileFromGitHub(imgPath);
          }
        }
      }

      // Supprimer le .json localement et sur GitHub
      fs.unlinkSync(filePath);
      await deleteFileFromGitHub(filePath);

      await interaction.update({
        content: `✅ Sanction \`${selectedFile}\` et ses images ont été supprimées.`,
        components: [],
      });
    } catch (error) {
      console.error(error);
      await interaction.update({ content: '❌ Erreur lors de la suppression.', components: [] });
    }
  }
};

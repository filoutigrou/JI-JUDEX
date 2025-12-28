const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = 'filoutigrou';
const repo = 'NODE-E';
const ABS_FOLDER = 'abs';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listeabs')
    .setDescription('Affiche toutes les absences enregistrées'),

  async execute(interaction) {
    try {
      const { data: files } = await octokit.repos.getContent({
        owner,
        repo,
        path: ABS_FOLDER,
      });

      const jsonFiles = files.filter(file => file.name.endsWith('.json'));

      if (jsonFiles.length === 0) {
        return interaction.reply({ content: '❌ Aucune absence trouvée.', ephemeral: true });
      }

      const absences = [];

      for (const file of jsonFiles) {
        const content = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path,
        });

        const buffer = Buffer.from(content.data.content, 'base64');
        const data = JSON.parse(buffer.toString());

        absences.push({
          utilisateur: data.utilisateur,
          nom: data.nom,
          prenom: data.prenom,
          debut: data.debut,
          fin: data.fin,
        });
      }

      const embeds = [];
      let currentEmbed = new EmbedBuilder()
        .setTitle('📋 Liste des absences')
        .setColor('Blue');

      let count = 0;

      for (const absence of absences) {
        if (count >= 25) {
          embeds.push(currentEmbed);
          currentEmbed = new EmbedBuilder().setColor('Blue');
          count = 0;
        }

        currentEmbed.addFields({
          name: `${absence.nom} ${absence.prenom} (${absence.utilisateur}))`,
          value: `🗓️ Du **${absence.debut}** au **${absence.fin}**`,
        });

        count++;
      }

      embeds.push(currentEmbed);

      await interaction.reply({ embeds, ephemeral: false });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: '❌ Une erreur est survenue lors de la récupération des absences.',
        ephemeral: true,
      });
    }
  }
};

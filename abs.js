const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = 'filoutigrou';
const repo = 'JI-JUDEX';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('absences')
    .setDescription('Déclare une absence via un formulaire'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('absence_modal')
      .setTitle('📋 Déclaration d\'absence');

    const fields = [
      { id: 'nom', label: 'Nom RP', style: TextInputStyle.Short },
      { id: 'prenom', label: 'Prénom RP', style: TextInputStyle.Short },
      { id: 'debut', label: 'Début d\'absence (jj/mm/aaaa)', style: TextInputStyle.Short },
      { id: 'fin', label: 'Fin d\'absence (jj/mm/aaaa)', style: TextInputStyle.Short },
    ];

    const components = fields.map(field =>
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(field.id)
          .setLabel(field.label)
          .setStyle(field.style)
          .setRequired(true)
      )
    );

    modal.addComponents(...components);
    await interaction.showModal(modal);
  },

  async handleModalSubmit(interaction) {
    if (interaction.customId !== 'absence_modal') return;

    const data = {
      utilisateur: interaction.user.tag,
      userId: interaction.user.id,
      nom: interaction.fields.getTextInputValue('nom'),
      prenom: interaction.fields.getTextInputValue('prenom'),
      debut: interaction.fields.getTextInputValue('debut'),
      fin: interaction.fields.getTextInputValue('fin'),
      dateEnregistrement: new Date().toISOString()
    };

    const safeTag = interaction.user.tag.replace(/[^a-z0-9]/gi, '_');
    const uniqueId = Date.now();
    const fileName = `${safeTag}_${interaction.user.id}_${uniqueId}.json`;
    const filePath = `abs/${fileName}`;

    try {
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: filePath,
        message: `📁 Ajout absence : ${fileName}`,
        content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
        committer: {
          name: 'JI-JUDEX Bot',
          email: 'bot@ji-judex.local'
        },
        author: {
          name: interaction.user.tag,
          email: 'no-reply@users.noreply.github.com'
        }
      });

      await interaction.reply({
        content: '✅ Ton absence a bien été enregistrée sur GitHub.',
        ephemeral: true
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement sur GitHub :', error);
      await interaction.reply({
        content: '❌ Une erreur est survenue lors de l\'enregistrement sur GitHub.',
        ephemeral: true
      });
    }
  }
};

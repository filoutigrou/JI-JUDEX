const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');
const axios = require('axios');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const owner = 'filoutigrou';
const repo = 'NODE-E';

const SANCTIONS_DIR = path.join(__dirname, 'sanctions');
if (!fs.existsSync(SANCTIONS_DIR)) fs.mkdirSync(SANCTIONS_DIR);

async function pushFileToGitHub(filePath, content) {
  const githubPath = `sanctions/${path.basename(filePath)}`;

  let sha;
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: githubPath,
    });
    sha = data.sha;
  } catch (error) {
    // Le fichier n'existe pas encore
  }

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: githubPath,
    message: `Ajout de ${path.basename(filePath)}`,
    content: Buffer.from(content).toString('base64'),
    sha,
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sanctionrp')
    .setDescription('Formulaire de sanction RP')
    // J'ai supprimé l'option "infraction" ici
    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Membre sanctionné (Facultatif)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('membre');

    // On prépare l'ID pour le modal. Si pas de targetUser, on met une chaine vide.
    const targetUserId = targetUser ? targetUser.id : '';
    
    // Structure simplifiée : sanctionrp_modal|USER_ID (plus besoin de passer l'infraction ici)
    const modalCustomId = `sanctionrp_modal|${targetUserId}`;

    const modal = new ModalBuilder()
      .setCustomId(modalCustomId)
      .setTitle('📝 Formulaire de sanction RP');

    const fields = [
      { id: 'pseudo', label: 'Pseudo Roblox', style: TextInputStyle.Short },
      { id: 'identite', label: 'Identité RP (Nom, Prénom, Naissance)', style: TextInputStyle.Paragraph },
      { id: 'age', label: 'Âge', style: TextInputStyle.Short },
      // Ici j'ai remplacé l'ID 'grade' par 'infraction' pour que ce soit logique dans le code
      { id: 'infraction', label: 'Infraction RP', style: TextInputStyle.Paragraph }, 
      { id: 'departement', label: 'Département du concerné', style: TextInputStyle.Short },
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
    if (!interaction.customId.startsWith('sanctionrp_modal')) return;

    // Récupération de l'ID utilisateur depuis le customId du modal
    const [, targetUserId] = interaction.customId.split('|');
    
    let pseudoDiscord = 'Non spécifié';

    // On cherche le membre seulement si un ID a été passé dans le modal
    if (targetUserId && targetUserId !== '' && interaction.guild) {
      try {
        const member = await interaction.guild.members.fetch(targetUserId);
        pseudoDiscord = member.user.tag;
      } catch (error) {
        console.error('Impossible de récupérer le membre ciblé:', error);
        pseudoDiscord = targetUserId; // Fallback sur l'ID si erreur
      }
    }

    const values = {
      utilisateur: interaction.user.tag,
      personneDiscord: pseudoDiscord,
      personneDiscordId: targetUserId || null,
      pseudo: interaction.fields.getTextInputValue('pseudo'),
      identite: interaction.fields.getTextInputValue('identite'),
      age: interaction.fields.getTextInputValue('age'),
      // On récupère maintenant l'infraction depuis le champ du modal
      infraction: interaction.fields.getTextInputValue('infraction'),
      departement: interaction.fields.getTextInputValue('departement'),
      date: new Date().toISOString(),
      images: []
    };

    const safePseudo = values.pseudo.replace(/[^a-z0-9_-]/gi, '_');
    // Si personneDiscord contient des caractères spéciaux ou espaces, on nettoie pour le nom de fichier
    const safeDiscord = pseudoDiscord.replace(/[^a-z0-9_-]/gi, '_');
    const timestamp = Date.now();
    
    // Nom du fichier JSON
    const fileName = `${safeDiscord}_${safePseudo}_${timestamp}.json`;
    const localFilePath = path.join(SANCTIONS_DIR, fileName);

    const confirmEmbed = new EmbedBuilder()
      .setTitle('✅ Sanction enregistrée')
      .setDescription(`Sanction enregistrée pour **${values.infraction}**. Merci d'envoyer **les images** de la personne concernée dans les **60 secondes**.`)
      .setColor(0x00cc66)
      .setTimestamp();

    await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });

    const filter = msg => msg.author.id === interaction.user.id && msg.attachments.size > 0;
    const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });

    collector.on('collect', async msg => {
      for (const [, attachment] of msg.attachments) {
        const imageURL = attachment.url;
        const ext = path.extname(imageURL).split('?')[0];
        const imageFileName = `${safePseudo}_${Date.now()}${ext}`;
        const imagePath = path.join(SANCTIONS_DIR, imageFileName);

        try {
          const response = await axios.get(imageURL, { responseType: 'arraybuffer' });
          fs.writeFileSync(imagePath, response.data);
          values.images.push(imageFileName);

          await pushFileToGitHub(imagePath, response.data);
        } catch (error) {
          console.error('Erreur téléchargement/push image:', error);
        }
      }
    });

    collector.on('end', async collected => {
      if (values.images.length === 0) {
        await interaction.followUp({ content: '⏱ Temps écoulé. Aucune image reçue.', ephemeral: true });
      } else {
        await interaction.followUp({ content: `✅ Données + images sauvegardées sous \`${fileName}\`.`, ephemeral: true });
      }

      const fileContent = JSON.stringify(values, null, 2);
      fs.writeFileSync(localFilePath, fileContent);

      try {
        await pushFileToGitHub(localFilePath, fileContent);
      } catch (error) {
        console.error('Erreur push JSON:', error);
      }
    });
  }
};

const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const { spawn } = require('child_process');
const archiveCommand = require('./archive.js');
const recapCommand = require('./recap.js');
const suparchCommand = require('./suparch.js');
const listeCommand = require('./liste.js');
const blackoutCommand = require('./blackout.js');
const sanctionRPCommand = require('./sanctions.js');
const recapSanctionsCommand = require('./recapsanctions.js');
const supprSanctionCommand = require('.//supsanction.js');
const absencesCommand = require('./abs.js');
const listeAbs = require('./listeabs');
const joinCommand = require('./join.js');
const reminder = require('./reminder.js');
const ticket = require('./ticket.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const Creator = ['858590105362628656'];
const présidenceID = ['1421216796769390626', '1448682399327322205'];
const directionID = ['1421216809054371962', '1448682414254587977'];
const delegationID = ['1421216821142618253', '1448682428343386164'];

function isCreator(interaction) {
  return Creator.includes(interaction.user.id);
}

function présidence(interaction) {
  return (
    isCreator(interaction) ||
    interaction.member.roles.cache.some(role => présidenceID.includes(role.id))
  );
}

function direction(interaction) {
  return (
    isCreator(interaction) ||
    interaction.member.roles.cache.some(role => directionID.includes(role.id))
  );
}

function delegation(interaction) {
  return (
    isCreator(interaction) ||
    interaction.member.roles.cache.some(role => delegationID.includes(role.id))
  );
}

function two(interaction) {
  return (
    isCreator(interaction) ||
    présidence(interaction) ||
    direction(interaction)
  );
}

function all(interaction) {
  return (
    isCreator(interaction) ||
    présidence(interaction) ||
    direction(interaction) ||
    delegation(interaction)
  );
}

// Lancer flask.js
const siteProcess = spawn('node', ['flask.js'], { stdio: 'inherit' });
// Gérer les erreurs si site.js ne se lance pas correctement
siteProcess.on('error', (error) => {
    console.error('Erreur lors du lancement de site.js :', error);
});
// Gérer la fermeture du processus site.js
siteProcess.on('close', (code) => {
    console.log(`Le processus site.js s'est terminé avec le code ${code}`);
});

// Déclaration des commandes slash
const commands = [
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulse un membre du serveur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('Le membre à expulser')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('Raison de l\'expulsion')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannit un membre du serveur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('Le membre à bannir')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('Raison du bannissement')
        .setRequired(true)
    ),
  
  new SlashCommandBuilder()
    .setName('deepwell')
    .setDescription('Envoie un embed déjà rempli pour l\'archivage dans les serveurs SCI.PNET'),

  new SlashCommandBuilder()
    .setName('pds')
    .setDescription('Prendre sa prise de service'),

  new SlashCommandBuilder()
    .setName('fds')
    .setDescription('Prendre vôtre fin de service'),

  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Créer un embed personnalisé via un formulaire.')
    .addChannelOption(option =>
      option.setName('salon')
      .setDescription('Salon où envoyer l\'embed')
      .setRequired(true)
    ),

    archiveCommand.data,
    recapCommand.data,
    suparchCommand.data,
    listeCommand.data,
    blackoutCommand.data,
    sanctionRPCommand.data,
    recapSanctionsCommand.data,
    supprSanctionCommand.data,
    absencesCommand.data,
    listeAbs.data,
    ticket.data
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
  console.log(`Connecté en tant que ${client.user.tag} !`);

  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('Commandes slash enregistrées avec succès !');
  } catch (err) {
    console.error('❌ Erreur lors de l\'enregistrement des commandes slash :', err);
  }

  // Démarrer le rappel automatique
  reminder.scheduleReminder(client);
});

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

  // /kick
  if (commandName === 'kick') {
    if (!all(interaction)) {
      return interaction.reply({ content: '🚫 Tu n’as pas la permission d’utiliser cette commande.', ephemeral: true });
    }

    const member = interaction.options.getMember('utilisateur');
    const raison = interaction.options.getString('raison');

    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ content: '🚫 Tu n’as pas la permission d’expulser des membres.', ephemeral: true });
    }

    if (!member) {
      return interaction.reply({ content: 'Utilisateur introuvable.', ephemeral: true });
    }

    if (!member.kickable) {
      return interaction.reply({ content: '❌ Je ne peux pas expulser cet utilisateur.', ephemeral: true });
    }

    await member.kick(raison);

    const embed = new EmbedBuilder()
      .setTitle('🔨 Membre expulsé')
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setColor(0xff7979)
      .addFields(
        { name: '👤 Utilisateur', value: `${member.user}`, inline: true },
        { name: '📄 Raison', value: raison, inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  // /ban
  if (commandName === 'ban') {
    if (!all(interaction)) {
      return interaction.reply({ content: '🚫 Tu n’as pas la permission d’utiliser cette commande.', ephemeral: true });
    }

    const member = interaction.options.getMember('utilisateur');
    const raison = interaction.options.getString('raison');

    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: '🚫 Tu n’as pas la permission de bannir des membres.', ephemeral: true });
    }

    if (!member) {
      return interaction.reply({ content: 'Utilisateur introuvable.', ephemeral: true });
    }

    if (!member.bannable) {
      return interaction.reply({ content: '❌ Je ne peux pas bannir cet utilisateur.', ephemeral: true });
    }

    await member.ban({ reason: raison });

    const embed = new EmbedBuilder()
      .setTitle('⛔ Membre banni')
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setColor(0xff7979)
      .addFields(
        { name: '👤 Utilisateur', value: `${member.user}`, inline: true },
        { name: '📄 Raison', value: raison, inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  // /deepwell
  if (commandName === 'deepwell') {
    if (!all(interaction)) {
      return interaction.reply({ content: '🚫 Tu n’as pas la permission d’utiliser cette commande.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('📁 Archivage dans les serveurs SCI.PNET - Justice')
      .setDescription('***⚠️ Cette communication a été automatiquement enregistrée dans les bases de données sécurisées de SCI.PNET sous la supervision de la Justice. Toute tentative de suppression ou d’altération est strictement interdite. ⚠️***')
      .setColor(0xFFFFFF)
      .setFooter({ text: 'JI - JUDEX', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    return interaction.reply({
      embeds: [embed],
      // Si tu veux que ce soit privé : flags: 64
      // flags: 64
    });
  }

  if (commandName === 'archive') {
    if (!all(interaction)) {
      return interaction.reply({ content: '🚫 Tu n’as pas la permission d’utiliser cette commande.', ephemeral: true });
    }

    await archiveCommand.execute(interaction);
  }
  
  if (commandName === 'recap') {
    if (!all(interaction)) {
      return interaction.reply({ content: '🚫 Tu n’as pas la permission d’utiliser cette commande.', ephemeral: true });
    }

  await recapCommand.execute(interaction);
  }

  if (commandName === 'pds') {
    if (!all(interaction)) {
      return interaction.reply({ content: '🚫 Tu n’as pas la permission d’utiliser cette commande.', ephemeral: true });
    }

    listeCommand.ajouterPDS(interaction.user.tag);

    const embed = new EmbedBuilder()
      .setTitle('🟢 Prise de service')
      .setDescription(`**${interaction.user} a officiellement commencé sa prise de service au sein du Comité d'Éthique.**\n\n🕒 Enregistré le ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`)
      .setColor(0x00cc66)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'fds') {
    if (!all(interaction)) {
      return interaction.reply({ content: '🚫 Tu n’as pas la permission d’utiliser cette commande.', ephemeral: true });
    }

    listeCommand.ajouterFDS(interaction.user.tag);

    const embed = new EmbedBuilder()
      .setTitle('🔴 Fin de service')
      .setDescription(`**${interaction.user} a officiellement terminé sa fin de service au sein du Comité d'Éthique.**\n\n🕒 Enregistré le ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`)
      .setColor(0xcc0000)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'deletearchive') {
    if (!présidence(interaction)) {
      return interaction.reply({ content: '🚫 Seule le président peut utiliser cette commande.', ephemeral: true });
    }

    await suparchCommand.execute(interaction);
  }

  if (commandName === 'liste') {
    if (!two(interaction)) {
      return interaction.reply({ content: '🚫 Seule le président ou la direction local peuvent utiliser cette commande.', ephemeral: true });
    }

    await listeCommand.execute(interaction);
  }

  if (commandName === 'blackout') {
    if (!présidence(interaction)) {
      return interaction.reply({ content: '🚫 Seule le président peut utiliser cette commande.', ephemeral: true });
    }

  await blackoutCommand.execute(interaction);
  }

  if (commandName === 'sanctionrp') {
    if (!all(interaction)) {
      return interaction.reply({ content: '🚫 Tu n’as pas la permission d’utiliser cette commande.', ephemeral: true });
    }

    await sanctionRPCommand.execute(interaction);
  }

  if (commandName === 'recapsanctions') {
    if (!two(interaction)) {
      return interaction.reply({ content: '🚫 Seule le président ou la direction local peuvent utiliser cette commande.', ephemeral: true });
    }

      await recapSanctionsCommand.execute(interaction);
  }

  if (commandName === 'supprsanction') {
    if (!two(interaction)) {
      return interaction.reply({ content: '🚫 Seule le président ou la direction local peuvent utiliser cette commande.', ephemeral: true });
    }

      await supprSanctionCommand.execute(interaction);
  }

  if (commandName === 'embed') {
    if (!présidence(interaction)) {
      return interaction.reply({ content: '🚫 Seule le président peut utiliser cette commande.', ephemeral: true });
    }

      const salon = interaction.options.getChannel('salon');

      if (salon.type !== ChannelType.GuildText) {
        return interaction.reply({ content: "Veuillez sélectionner un salon textuel.", ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId(`embedModal_${salon.id}`)
        .setTitle('Créateur d\'embed');

      const titleInput = new TextInputBuilder()
        .setCustomId('embedTitle')
        .setLabel('Titre de l\'embed')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const descInput = new TextInputBuilder()
        .setCustomId('embedDesc')
        .setLabel('Description')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const colorInput = new TextInputBuilder()
        .setCustomId('embedColor')
        .setLabel('Couleur de l\'embed (en hexadécimal)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('ex: #ff0000')

      const imageInput = new TextInputBuilder()
        .setCustomId('embedImage')
        .setLabel('URL de l\'image (optionnelle)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descInput),
        new ActionRowBuilder().addComponents(colorInput),
        new ActionRowBuilder().addComponents(imageInput)
      );

      return await interaction.showModal(modal);
    }

    if (commandName === 'absences') {
      if (!all(interaction)) {
        return interaction.reply({ content: '🚫 Tu n’as pas la permission d’utiliser cette commande.', ephemeral: true });
      }
    
      await absencesCommand.execute(interaction);
    }
    
    if (commandName === 'listeabs') {
      if (!two(interaction)) {
        return interaction.reply({ content: '🚫 Tu n’as pas la permission d’utiliser cette commande.', ephemeral: true });
      }
    
    await listeAbs.execute(interaction);
    }
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'select_sanction_delete') {
      await supprSanctionCommand.handleSelect(interaction);
      }
    }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'select_sanction') {
      await recapSanctionsCommand.handleSelect(interaction);
    }
  }

  // === Gestion de la soumission du modal ===
  if (interaction.isModalSubmit() && interaction.customId.startsWith('embedModal_')) {
    const salonId = interaction.customId.split('_')[1];
    const salon = await interaction.guild.channels.fetch(salonId).catch(() => null);

    if (!salon || salon.type !== ChannelType.GuildText) {
      return interaction.reply({ content: "Salon invalide ou introuvable.", ephemeral: true });
    }

    const title = interaction.fields.getTextInputValue('embedTitle');
    const description = interaction.fields.getTextInputValue('embedDesc');
    const color = interaction.fields.getTextInputValue('embedColor')
    const image = interaction.fields.getTextInputValue('embedImage');

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();

    // Vérification de la couleur
    if (/^#?[0-9A-Fa-f]{6}$/.test(color)) {
    // Si la couleur est au format hexadécimal valide (ex: "#FFAA00" ou "FFAA00")
      const cleanColor = color.replace('#', '');
      embed.setColor(parseInt(cleanColor, 16));
    } else {
      embed.setColor(0x3ea1ff);
    }

    if (image) embed.setImage(image);

    await salon.send({ embeds: [embed] });
    await interaction.reply({ content: `✅ Embed envoyé dans ${salon}`, ephemeral: true });
  }

  if (interaction.isModalSubmit()) {
    await sanctionRPCommand.handleModalSubmit(interaction);
  }

  if (interaction.isModalSubmit()) {
    try {
      await absencesCommand.handleModalSubmit(interaction);
    } catch (error) {
      console.error(error);
    }
  }
});

client.on('guildMemberAdd', async member => {
  await joinCommand.handleJoin(member);
});

client.login(process.env.TOKEN);

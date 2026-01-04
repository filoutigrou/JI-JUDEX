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
const supprSanctionCommand = require('./supsanction.js'); 
const absencesCommand = require('./abs.js');
const listeAbs = require('./listeabs');
const joinCommand = require('./join.js');
const reminder = require('./reminder.js');
const ticket = require('./ticket.js');
const serviceCommand = require('./service.js');
const permanenceCommand = require('./permanence.js');
const rapportCommand = require('./rapport.js');

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
const administrationID = ['1452256490395140237'];
const personnelID = ['1452256494153105571'];
const hautconseilID = ['1452256444048081009'];
const directionID = ['1452256438780170252'];
const supportID = ['1454781580118589512'];
const colonelID = ['1452256517393744065'];
const ltcID = ['1452256518547181610'];
const sejID = ['1452256459055431754'];
const cacID = ['1452256464868741231'];
const cjID = ['1452256441418256556'];
const gdsID = ['1452256513283461131'];
const adgID = ['1452256440277270629'];

function isCreator(interaction) {
  return Creator.includes(interaction.user.id);
}
function administration(interaction) {
  return (isCreator(interaction) || interaction.member.roles.cache.some(role => administrationID.includes(role.id)));
}
function personnel(interaction) {
  return (isCreator(interaction) || interaction.member.roles.cache.some(role => personnelID.includes(role.id)));
}
function hautconseil(interaction) {
  return (isCreator(interaction) || interaction.member.roles.cache.some(role => hautconseilID.includes(role.id)));
}
function direction(interaction) {
  return (isCreator(interaction) || interaction.member.roles.cache.some(role => directionID.includes(role.id)));
}
function support(interaction) {
  return (isCreator(interaction) || interaction.member.roles.cache.some(role => supportID.includes(role.id)));
}
function colonel(interaction) {
  return (isCreator(interaction) || interaction.member.roles.cache.some(role => colonelID.includes(role.id)));
}
function ltc(interaction) {
  return (isCreator(interaction) || interaction.member.roles.cache.some(role => ltcID.includes(role.id)));
}
function sej(interaction) {
  return (isCreator(interaction) || interaction.member.roles.cache.some(role => sejID.includes(role.id)));
}
function cac(interaction) {
  return (isCreator(interaction) || interaction.member.roles.cache.some(role => cacID.includes(role.id)));
}
function cj(interaction) {
  return (isCreator(interaction) || interaction.member.roles.cache.some(role => cjID.includes(role.id)));
}
function gds(interaction) {
  return (isCreator(interaction) || interaction.member.roles.cache.some(role => gdsID.includes(role.id)));
}
function adg(interaction) {
  return (isCreator(interaction) || interaction.member.roles.cache.some(role => adgID.includes(role.id)));
}
function three(interaction) {
  return (isCreator(interaction) || administration(interaction) || hautconseil(interaction) || direction(interaction));
}
function liste(interaction) {
  return (isCreator(interaction) || colonel(interaction) || ltc(interaction) || sej(interaction) || cac(interaction));
}
function suppr(interaction) {
  return (isCreator(interaction) || cj(interaction) || gds(interaction) || direction(interaction) || adg(interaction));
}
function abss(interaction) {
  return (isCreator(interaction) || cj(interaction) || gds(interaction) || direction(interaction) || colonel(interaction) || ltc(interaction) || adg(interaction));
}

// Lancer flask.js
const siteProcess = spawn('node', ['flask.js'], { stdio: 'inherit' });
siteProcess.on('error', (error) => console.error('Erreur lancement flask.js :', error));
siteProcess.on('close', (code) => console.log(`Processus flask.js terminé code ${code}`));

// Commandes Slash
const commands = [
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulse un membre')
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre').setRequired(true))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison').setRequired(true)),
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannit un membre')
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre').setRequired(true))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison').setRequired(true)),
  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Créer un embed via formulaire')
    .addChannelOption(opt => opt.setName('salon').setDescription('Salon destination').setRequired(true)),

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
    ticket.data,
    serviceCommand.data,
    permanenceCommand.data,
    rapportCommand.data
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
  console.log(`Connecté : ${client.user.tag}`);
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log('Commandes slash enregistrées.');
  } catch (err) {
    console.error('Erreur commandes slash :', err);
  }
  reminder.scheduleReminder(client);
});

client.on('interactionCreate', async interaction => {
  
  // ==========================================
  //        SLASH COMMANDS
  // ==========================================
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    // --- GESTION RAPPORT (NOUVEAU) ---
    if (commandName === 'rapport') {
        // J'ai mis permission "personnel" ici, tu peux changer si besoin (ex: all(interaction))
        if (!personnel(interaction)) return interaction.reply({ content: '🚫 Permission refusée.', ephemeral: true });
        await rapportCommand.execute(interaction);
    }

    if (commandName === 'permanence') {
        if (!administration(interaction)) return interaction.reply({ content: '🚫 Réservé à l\'administration.', ephemeral: true });
        await permanenceCommand.execute(interaction);
    }

    // --- GESTION POINTEUSE (PANEL) ---
    if (commandName === 'pointeuse') {
        if (!administration(interaction)) return interaction.reply({ content: '🚫 Réservé à l\'administration.', ephemeral: true });
        await serviceCommand.execute(interaction);
    }

    // --- GESTION TICKET ---
    if (commandName === 'ticket') {
        const subCommand = interaction.options.getSubcommand();
        if (subCommand === 'panel') {
            if (!administration(interaction)) { // Modifié pour utiliser tes fonctions
                return interaction.reply({ content: '🚫 Seule l\'administration.', ephemeral: true });
            }
        } else if (subCommand === 'delete') {
            if (!directeur(interaction)) {
                return interaction.reply({ content: '🚫 Permission refusée.', ephemeral: true });
            }
        } else if (subCommand === 'remove') {
            if (!administration(interaction)) {
                return interaction.reply({ content: '🚫 Permission refusée.', ephemeral: true });
            }
        } else {
          if (!support(interaction)) {
                return interaction.reply({ content: '🚫 Permission refusée.', ephemeral: true });
            }
        }
        await ticket.execute(interaction);
        return;
    }
    // ----------------------------------------------

    if (commandName === 'kick') {
      if (!administration(interaction)) return interaction.reply({ content: '🚫 Permission refusée.', ephemeral: true });
      const member = interaction.options.getMember('utilisateur');
      const raison = interaction.options.getString('raison');
      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) return interaction.reply({ content: '🚫 Permission Discord manquante.', ephemeral: true });
      if (!member) return interaction.reply({ content: 'Introuvable.', ephemeral: true });
      if (!member.kickable) return interaction.reply({ content: '❌ Impossible d\'expulser.', ephemeral: true });
      await member.kick(raison);
      const embed = new EmbedBuilder().setTitle('🔨 Expulsé').setColor(0xff7979).addFields({ name: '👤 Utilisateur', value: `${member.user}`, inline: true }, { name: '📄 Raison', value: raison, inline: true }).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'ban') {
      if (!administration(interaction)) return interaction.reply({ content: '🚫 Permission refusée.', ephemeral: true });
      const member = interaction.options.getMember('utilisateur');
      const raison = interaction.options.getString('raison');
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) return interaction.reply({ content: '🚫 Permission Discord manquante.', ephemeral: true });
      if (!member) return interaction.reply({ content: 'Introuvable.', ephemeral: true });
      if (!member.bannable) return interaction.reply({ content: '❌ Impossible de bannir.', ephemeral: true });
      await member.ban({ reason: raison });
      const embed = new EmbedBuilder().setTitle('⛔ Banni').setColor(0xff7979).addFields({ name: '👤 Utilisateur', value: `${member.user}`, inline: true }, { name: '📄 Raison', value: raison, inline: true }).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'archive') { if (three(interaction)) await archiveCommand.execute(interaction); else interaction.reply({ content: '🚫 Permission refusée.', ephemeral: true }); }
    if (commandName === 'recap') { if (administration(interaction)) await recapCommand.execute(interaction); else interaction.reply({ content: '🚫 Permission refusée.', ephemeral: true }); }
    
    // ANCIENNES COMMANDES PDS/FDS SUPPRIMEES D'ICI car remplacées par les boutons

    if (commandName === 'deletearchive') { if (administration(interaction)) await suparchCommand.execute(interaction); else interaction.reply({ content: '🚫 Réservé Administration.', ephemeral: true }); }
    if (commandName === 'liste') { if (liste(interaction)) await listeCommand.execute(interaction); else interaction.reply({ content: '🚫 Réservé Direction+.', ephemeral: true }); }
    if (commandName === 'blackout') { if (administration(interaction)) await blackoutCommand.execute(interaction); else interaction.reply({ content: '🚫 Réservé Administration.', ephemeral: true }); }
    if (commandName === 'sanctionrp') { if (personnel(interaction)) await sanctionRPCommand.execute(interaction); else interaction.reply({ content: '🚫 Permission refusée.', ephemeral: true }); }
    if (commandName === 'recapsanctions') { if (administration(interaction)) await recapSanctionsCommand.execute(interaction); else interaction.reply({ content: '🚫 Réservé Direction+.', ephemeral: true }); }
    if (commandName === 'supprsanction') { if (suppr(interaction)) await supprSanctionCommand.execute(interaction); else interaction.reply({ content: '🚫 Réservé Direction+.', ephemeral: true }); }
    
    if (commandName === 'embed') {
      if (!administration(interaction)) return interaction.reply({ content: '🚫 Réservé Administration.', ephemeral: true });
      const salon = interaction.options.getChannel('salon');
      if (salon.type !== ChannelType.GuildText) return interaction.reply({ content: "Salon textuel requis.", ephemeral: true });
      
      const modal = new ModalBuilder().setCustomId(`embedModal_${salon.id}`).setTitle('Créateur d\'embed');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('embedTitle').setLabel('Titre').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('embedDesc').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('embedColor').setLabel('Couleur (Hex)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('#ff0000')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('embedImage').setLabel('URL Image').setStyle(TextInputStyle.Short).setRequired(false))
      );
      return await interaction.showModal(modal);
    }

    if (commandName === 'absences') { if (personnel(interaction)) await absencesCommand.execute(interaction); else interaction.reply({ content: '🚫 Permission refusée.', ephemeral: true }); }
    if (commandName === 'listeabs') { if (abss(interaction)) await listeAbs.execute(interaction); else interaction.reply({ content: '🚫 Réservé Direction+.', ephemeral: true }); }
  }

  // ==========================================
  //        BOUTONS (Tickets + PDS/FDS)
  // ==========================================
  if (interaction.isButton()) {
      // 1. Boutons Tickets
      if (interaction.customId.startsWith('open_ticket_') || 
          ['btn_claim_ticket', 'btn_close_ticket', 'btn_delete_ticket'].includes(interaction.customId)) {
          await ticket.handleButtons(interaction);
          return;
      }

      // 2. Boutons Service (Pointeuse)
      if (interaction.customId === 'btn_pds') {
          
          await listeCommand.ajouterPDS(interaction.user.tag);
          
          const embed = new EmbedBuilder()
              .setTitle('🟢 Prise de service')
              .setDescription(`**${interaction.user} a commencé sa PDS.**`)
              .setColor(0x00cc66)
              .setTimestamp();
          
          // Ephemeral: true pour ne pas spammer le salon du panel
          return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (interaction.customId === 'btn_fds') {
          
          await listeCommand.ajouterFDS(interaction.user.tag);
          
          const embed = new EmbedBuilder()
              .setTitle('🔴 Fin de service')
              .setDescription(`**${interaction.user} a terminé sa FDS.**`)
              .setColor(0xcc0000)
              .setTimestamp();
          
          return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // 3. Boutons Permanence (NOUVEAU)
      if (interaction.customId === 'btn_prise_perm' || interaction.customId === 'btn_fin_perm') {
           await permanenceCommand.handleButtons(interaction);
           return;
      }
  }

  // ==========================================
  //        SELECT MENUS
  // ==========================================
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'select_sanction_delete') await supprSanctionCommand.handleSelect(interaction);
    if (interaction.customId === 'select_sanction') await recapSanctionsCommand.handleSelect(interaction);
  }

  // ==========================================
  //        GESTION DES MODALS
  // ==========================================
  if (interaction.isModalSubmit()) {
    
    // --- GESTION MODAL RAPPORT (NOUVEAU) ---
    // On détecte si l'ID commence par rapport_modal_
    if (interaction.customId.startsWith('rapport_modal_')) {
        await rapportCommand.handleModalSubmit(interaction);
        return;
    }

    // 1. Modals Tickets
    if (interaction.customId.startsWith('modal_ticket_')) {
        await ticket.handleModals(interaction);
        return; 
    }

    // 2. Modal Embed
    if (interaction.customId.startsWith('embedModal_')) {
      const salonId = interaction.customId.split('_')[1];
      const salon = await interaction.guild.channels.fetch(salonId).catch(() => null);

      if (!salon || salon.type !== ChannelType.GuildText) return interaction.reply({ content: "Salon invalide.", ephemeral: true });

      const title = interaction.fields.getTextInputValue('embedTitle');
      const description = interaction.fields.getTextInputValue('embedDesc');
      const color = interaction.fields.getTextInputValue('embedColor');
      const image = interaction.fields.getTextInputValue('embedImage');

      const embed = new EmbedBuilder().setTitle(title).setDescription(description).setTimestamp();
      if (/^#?[0-9A-Fa-f]{6}$/.test(color)) embed.setColor(parseInt(color.replace('#', ''), 16));
      else embed.setColor(0x3ea1ff);
      if (image) embed.setImage(image);

      await salon.send({ embeds: [embed] });
      await interaction.reply({ content: `✅ Embed envoyé dans ${salon}`, ephemeral: true });
      return; 
    }

    // 3. Modals Sanctions & Absences
    await sanctionRPCommand.handleModalSubmit(interaction);
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
/**
 * SYSTEME DE TICKET DISCORD AVANCÉ (Slash Commands)
 * * Fonctionnalités :
 * - Panel avec boutons catégories
 * - Formulaires (Modals)
 * - Slash Commands (/ticket close, /ticket add, etc.)
 * - Système de Claim
 * - Cycle de vie : Fermeture (invisible) -> Sauvegarde HTML -> Suppression
 * * Installation :
 * 1. npm install discord.js dotenv
 * 2. Créer un fichier .env avec :
 * DISCORD_TOKEN=...
 * CLIENT_ID=...
 * GUILD_ID=...
 * 3. Remplir le rôle STAFF et les IDs dans ce fichier (bot.js)
 * 4. Lancer : node bot.js
 */

require('dotenv').config(); // Charge les variables du fichier .env

const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    PermissionsBitField,
    AttachmentBuilder,
    ChannelType,
    SlashCommandBuilder,
    REST,
    Routes
} = require('discord.js');

// ==========================================
//              CONFIGURATION
// ==========================================
const CONFIG = {
    // Récupération des valeurs sensibles depuis le fichier .env
    TOKEN: process.env.DISCORD_TOKEN, 
    CLIENT_ID: process.env.CLIENT_ID, 
    GUILD_ID: process.env.GUILD_ID,

    // Configuration directe (IDs à remplacer ici)
    STAFF_ROLE_ID: "1454781580118589512",

    // Configuration des catégories de tickets
    TICKET_TYPES: {
        'tech': {
            label: 'Support Technique',
            emoji: '🔧',
            style: ButtonStyle.Primary,
            categoryId: '1454781896327172364',
            logChannelId: '1454782238464933973',
            useModal: true,
            modalTitle: 'Détails techniques',
            modalFieldLabel: 'Décrivez votre problème'
        },
        'commercial': {
            label: 'Commercial',
            emoji: '💰',
            style: ButtonStyle.Success,
            categoryId: '1454782101172785193',
            logChannelId: '1454782262330523711',
            useModal: false
        }
    }
};

// ==========================================
//           DEFINITION DE LA COMMANDE (DATA)
// ==========================================
// Cette partie est extraite pour être exportable et déployable ailleurs si besoin
const TICKET_COMMAND_DATA = new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Commandes du système de tickets')
    .addSubcommand(sub => 
        sub.setName('panel').setDescription('Afficher le panel de tickets (Admin)')
    )
    .addSubcommand(sub => 
        sub.setName('close').setDescription('Fermer le ticket (rend invisible au créateur)')
    )
    .addSubcommand(sub => 
        sub.setName('delete').setDescription('Supprimer définitivement le ticket (avec sauvegarde)')
    )
    .addSubcommand(sub => 
        sub.setName('claim').setDescription('Prendre en charge le ticket')
    )
    .addSubcommand(sub => 
        sub.setName('add').setDescription('Ajouter un utilisateur au ticket')
        .addUserOption(option => option.setName('target').setDescription('L\'utilisateur').setRequired(true))
    )
    .addSubcommand(sub => 
        sub.setName('remove').setDescription('Retirer un utilisateur du ticket')
        .addUserOption(option => option.setName('target').setDescription('L\'utilisateur').setRequired(true))
    );

// ==========================================
//           INITIALISATION CLIENT
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Channel]
});

// ==========================================
//           GENERATEUR HTML (TRANSCRIPT)
// ==========================================
function generateHTML(messages, channelName, closerTag, ticketType) {
    const reversedMessages = Array.from(messages.values()).reverse();
    
    let itemsHtml = reversedMessages.map(m => {
        const author = m.author;
        const content = m.content || (m.embeds.length > 0 ? "<em>[Contenu Embed]</em>" : "<em>[Média/Fichier]</em>");
        const date = new Date(m.createdTimestamp).toLocaleString('fr-FR');
        const avatarUrl = author.displayAvatarURL({ extension: 'png', size: 64 });
        
        let attachmentsHtml = "";
        if (m.attachments.size > 0) {
            attachmentsHtml = `<div class="attachments">
                ${m.attachments.map(a => `<a href="${a.url}" target="_blank">Pièce jointe: ${a.name}</a>`).join('<br>')}
            </div>`;
        }

        return `
        <div class="message-group">
            <div class="avatar"><img src="${avatarUrl}" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'"></div>
            <div class="message-content">
                <div class="meta">
                    <span class="username" style="color: ${m.member?.displayHexColor !== '#000000' ? m.member?.displayHexColor : '#fff'}">${author.username}</span>
                    <span class="timestamp">${date}</span>
                </div>
                <div class="text">${content
                    .replace(/</g, "&lt;").replace(/>/g, "&gt;")
                    .replace(/\n/g, "<br>")}</div> 
                ${attachmentsHtml}
            </div>
        </div>`;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Transcript - ${channelName}</title>
    <style>
        body { background-color: #36393f; color: #dcddde; font-family: "Whitney", "Helvetica Neue", Helvetica, Arial, sans-serif; margin: 0; padding: 20px; font-size: 16px; }
        .header { border-bottom: 1px solid #2f3136; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #fff; }
        .header p { color: #72767d; }
        .message-group { display: flex; margin-bottom: 20px; }
        .avatar { width: 50px; height: 50px; border-radius: 50%; overflow: hidden; margin-right: 15px; flex-shrink: 0; }
        .avatar img { width: 100%; height: 100%; }
        .meta { margin-bottom: 5px; }
        .username { font-weight: 600; cursor: pointer; }
        .timestamp { color: #72767d; font-size: 12px; margin-left: 5px; }
        .text { line-height: 1.4; white-space: pre-wrap; color: #dcddde; }
        .attachments { margin-top: 10px; font-size: 14px; }
        .attachments a { color: #00b0f4; text-decoration: none; }
    </style>
</head>
<body>
    <div class="header">
        <h1>#${channelName}</h1>
        <p>Catégorie: ${ticketType}<br>Exporté le ${new Date().toLocaleString('fr-FR')}<br>Action par : ${closerTag}</p>
    </div>
    <div class="messages">
        ${itemsHtml}
    </div>
</body>
</html>`;
}

// ==========================================
//        ENREGISTREMENT DES COMMANDES
// ==========================================
async function registerCommands() {
    // On utilise la donnée définie plus haut
    const commands = [ TICKET_COMMAND_DATA.toJSON() ];

    const rest = new REST({ version: '10' }).setToken(CONFIG.TOKEN);

    try {
        console.log('🔄 Enregistrement des Slash Commands...');
        await rest.put(
            Routes.applicationGuildCommands(CONFIG.CLIENT_ID, CONFIG.GUILD_ID),
            { body: commands },
        );
        console.log('✅ Slash Commands enregistrées !');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des commandes:', error);
    }
}

// ==========================================
//             LOGIQUE DU BOT
// ==========================================

client.once('ready', async () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
    await registerCommands();
});

client.on('interactionCreate', async interaction => {
    
    // ------------------------------------------
    //        GESTION DES SLASH COMMANDS
    // ------------------------------------------
    if (interaction.isChatInputCommand()) {
        const { commandName, options } = interaction;

        if (commandName === 'ticket') {
            const subCommand = options.getSubcommand();
            const channel = interaction.channel;

            // --- /ticket panel (SETUP) ---
            if (subCommand === 'panel') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({ content: "❌ Réservé aux administrateurs.", ephemeral: true });
                }

                const row = new ActionRowBuilder();
                for (const [key, value] of Object.entries(CONFIG.TICKET_TYPES)) {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`open_ticket_${key}`)
                            .setLabel(value.label)
                            .setEmoji(value.emoji)
                            .setStyle(value.style)
                    );
                }

                const embed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('📞 Centre de Support')
                    .setDescription('Sélectionnez une catégorie ci-dessous pour ouvrir un ticket.')
                    .setFooter({ text: 'Le staff vous répondra rapidement.' });

                await interaction.channel.send({ embeds: [embed], components: [row] });
                return interaction.reply({ content: "Panel créé !", ephemeral: true });
            }

            // Vérification : Est-ce un ticket ?
            if (!channel.name.startsWith('ticket-')) {
                return interaction.reply({ content: "❌ Cette commande n'est utilisable que dans un ticket.", ephemeral: true });
            }

            // --- /ticket claim ---
            if (subCommand === 'claim') {
                await handleClaim(interaction);
            }

            // --- /ticket close ---
            else if (subCommand === 'close') {
                await handleClose(interaction);
            }

            // --- /ticket delete ---
            else if (subCommand === 'delete') {
                await handleDelete(interaction);
            }

            // --- /ticket add ---
            else if (subCommand === 'add') {
                const target = options.getUser('target');
                await channel.permissionOverwrites.edit(target, { 
                    ViewChannel: true, 
                    SendMessages: true 
                });
                await interaction.reply(`✅ ${target} a été ajouté au ticket.`);
            }

            // --- /ticket remove ---
            else if (subCommand === 'remove') {
                const target = options.getUser('target');
                await channel.permissionOverwrites.edit(target, { 
                    ViewChannel: false, 
                    SendMessages: false 
                });
                await interaction.reply(`👋 ${target} a été retiré du ticket.`);
            }
        }
    }

    // ------------------------------------------
    //           GESTION DES BOUTONS
    // ------------------------------------------
    if (interaction.isButton()) {
        const customId = interaction.customId;
        
        // Ouverture ticket
        if (customId.startsWith('open_ticket_')) {
            const typeKey = customId.replace('open_ticket_', '');
            const typeConfig = CONFIG.TICKET_TYPES[typeKey];
            if (!typeConfig) return interaction.reply({ content: "Erreur config.", ephemeral: true });

            if (typeConfig.useModal) {
                const modal = new ModalBuilder()
                    .setCustomId(`modal_ticket_${typeKey}`)
                    .setTitle(typeConfig.modalTitle);
                const reasonInput = new TextInputBuilder()
                    .setCustomId('ticket_reason')
                    .setLabel(typeConfig.modalFieldLabel)
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
                await interaction.showModal(modal);
            } else {
                await createTicket(interaction, typeKey, "Aucune raison (Ouverture directe)");
            }
        }

        // Actions dans le ticket
        else if (customId === 'btn_claim_ticket') {
            await handleClaim(interaction);
        }
        else if (customId === 'btn_close_ticket') {
            await handleClose(interaction);
        }
        else if (customId === 'btn_delete_ticket') {
            await handleDelete(interaction);
        }
    }

    // ------------------------------------------
    //           GESTION DES MODALS
    // ------------------------------------------
    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('modal_ticket_')) {
            const typeKey = interaction.customId.replace('modal_ticket_', '');
            const reason = interaction.fields.getTextInputValue('ticket_reason');
            await createTicket(interaction, typeKey, reason);
        }
    }
});

// ==========================================
//             FONCTIONS ACTIONS
// ==========================================

// 1. CREATION TICKET
async function createTicket(interaction, typeKey, reason) {
    const typeConfig = CONFIG.TICKET_TYPES[typeKey];
    const guild = interaction.guild;
    const user = interaction.user;
    const channelName = `ticket-${user.username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}-${Math.floor(Math.random() * 1000)}`;

    try {
        const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: typeConfig.categoryId,
            topic: `${user.id}`, // On stocke l'ID du créateur dans le topic pour le retrouver
            permissionOverwrites: [
                { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                { id: CONFIG.STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels] }
            ]
        });

        const embed = new EmbedBuilder()
            .setColor(typeConfig.style === ButtonStyle.Primary ? '#5865F2' : '#57F287')
            .setTitle(`${typeConfig.emoji} ${typeConfig.label}`)
            .setDescription(`Bonjour <@${user.id}> !\n**Raison:** ${reason}\n\nUn membre du staff va prendre votre ticket en charge.`)
            .setTimestamp();

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_claim_ticket').setLabel('Prendre en charge').setEmoji('🙋‍♂️').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('btn_close_ticket').setLabel('Fermer').setEmoji('🔒').setStyle(ButtonStyle.Danger)
        );

        await channel.send({ content: `<@${user.id}> | <@&${CONFIG.STAFF_ROLE_ID}>`, embeds: [embed], components: [buttons] });
        await interaction.reply({ content: `✅ Ticket créé : ${channel}`, ephemeral: true });

    } catch (error) {
        console.error(error);
        await interaction.reply({ content: "❌ Erreur création ticket.", ephemeral: true });
    }
}

// 2. CLAIM TICKET
async function handleClaim(interaction) {
    await interaction.deferUpdate(); // Ou deferReply si slash command
    const user = interaction.user;
    const channel = interaction.channel;

    const embed = new EmbedBuilder()
        .setDescription(`✅ Ticket pris en charge par <@${user.id}>`)
        .setColor('#FEE75C');

    await channel.send({ embeds: [embed] });
    
    // Optionnel : Renommer le salon
    // await channel.setName(`claimed-${channel.name}`);
}

// 3. CLOSE TICKET (Rend invisible au créateur)
async function handleClose(interaction) {
    // Si bouton, deferUpdate. Si Slash, deferReply
    if (interaction.isButton()) await interaction.deferUpdate();
    else await interaction.deferReply();

    const channel = interaction.channel;
    
    // Récupérer l'ID du créateur depuis le topic
    const creatorId = channel.topic; 
    
    if (creatorId) {
        // Retirer la permission de voir au créateur
        await channel.permissionOverwrites.edit(creatorId, { 
            ViewChannel: false 
        });
    }

    const embed = new EmbedBuilder()
        .setTitle('🔒 Ticket Fermé')
        .setDescription("Le ticket est fermé et invisible pour le créateur.\nLe staff peut encore lire l'historique.\n\n**Appuyez sur Supprimer pour sauvegarder et effacer.**")
        .setColor('#ED4245');

    const deleteRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_delete_ticket').setLabel('Supprimer définitivement (Save & Delete)').setEmoji('🗑️').setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [embed], components: [deleteRow] });
    
    // Feedback à l'executeur si c'était une slash commande
    if (interaction.isChatInputCommand()) await interaction.editReply("Ticket fermé.");
}

// 4. DELETE TICKET (Save HTML & Delete)
async function handleDelete(interaction) {
    if (interaction.isButton()) await interaction.deferUpdate();
    else await interaction.deferReply();

    const channel = interaction.channel;
    await channel.send("💾 **Génération de la sauvegarde et suppression...**");

    // Retrouver la catégorie pour savoir où envoyer les logs
    let ticketTypeKey = null;
    let categoryName = "Inconnu";
    for (const [key, value] of Object.entries(CONFIG.TICKET_TYPES)) {
        if (channel.parentId === value.categoryId) {
            ticketTypeKey = key;
            categoryName = value.label;
            break;
        }
    }

    if (!ticketTypeKey) {
        // Fallback si la catégorie a changé ou n'est pas trouvée
        // On essaie de prendre le premier log channel dispo ou on log juste une erreur
        // Pour l'exemple, on continue sans envoyer si pas trouvé, ou on envoie dans le premier
    }

    // Récupération messages
    const messages = await channel.messages.fetch({ limit: 100 });
    const htmlContent = generateHTML(messages, channel.name, interaction.user.tag, categoryName);
    const buffer = Buffer.from(htmlContent, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.html` });

    // Envoi Log
    if (ticketTypeKey) {
        const logChannelId = CONFIG.TICKET_TYPES[ticketTypeKey].logChannelId;
        const logChannel = client.channels.cache.get(logChannelId);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('🗑️ Ticket Supprimé')
                .addFields(
                    { name: 'Ticket', value: channel.name, inline: true },
                    { name: 'Supprimé par', value: interaction.user.tag, inline: true },
                    { name: 'Catégorie', value: categoryName, inline: true }
                )
                .setColor('#000000')
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed], files: [attachment] });
        }
    }

    // Suppression finale (petite pause pour laisser le temps d'upload si besoin, mais await suffit souvent)
    setTimeout(() => channel.delete(), 2000);
}

// ==========================================
//               EXPORTS
// ==========================================
// Permet d'importer la structure de la commande dans un autre fichier
module.exports = {
    data: TICKET_COMMAND_DATA,
    CONFIG
};

// Démarrage du bot si exécuté directement
if (require.main === module) {
    client.login(CONFIG.TOKEN);
}
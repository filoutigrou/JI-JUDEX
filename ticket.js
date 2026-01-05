/**
 * MODULE SYSTEME DE TICKET (Version Avancée - Panels Séparés)
 * Note: Les permissions sont gérées dans index.js
 */

const { 
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
    SlashCommandBuilder
} = require('discord.js');

// ==========================================
//              CONFIGURATION
// ==========================================
const CONFIG = {
    // ID du Rôle qui a accès aux tickets (Staff)
    STAFF_ROLE_ID: "1454781580118589512", 

    // Configuration des 3 types de tickets
    TICKET_TYPES: {
        'accreditation': {
            label: 'Demande d\'Accréditation',
            description: 'Cliquez sur le bouton ci-dessous pour remplir le formulaire de demande d\'accréditation.',
            emoji: '🪪',
            style: ButtonStyle.Primary, // Bleu
            color: '#5865F2', // Couleur de l'embed
            categoryId: '1454781896327172364', 
            logChannelId: '1454782238464933973', 
            modalTitle: 'Formulaire d\'Accréditation',
            fields: [
                { id: 'identite', label: 'Nom/Prénom RP', style: TextInputStyle.Short },
                { id: 'grade_actuel', label: 'Grade/Poste Actuel', style: TextInputStyle.Short },
                { id: 'demande', label: 'Accréditation demandée', style: TextInputStyle.Short },
                { id: 'motif', label: 'Preuves (image...)', style: TextInputStyle.Short }
            ]
        },
        'rdv': {
            label: 'Demande de RDV',
            description: 'Vous souhaitez rencontrer la direction ? Cliquez ci-dessous pour fixer une date.',
            emoji: '📅',
            style: ButtonStyle.Success, // Vert
            color: '#57F287',
            categoryId: '1454782101172785193', 
            logChannelId: '1454782262330523711', 
            modalTitle: 'Prise de Rendez-vous',
            fields: [
                { id: 'sujet', label: 'Sujet du RDV', style: TextInputStyle.Short },
                { id: 'concerne', label: 'Personne(s) concernée(s)', style: TextInputStyle.Short },
                { id: 'dispo', label: 'Vos disponibilités (Dates/Heures)', style: TextInputStyle.Paragraph }
            ]
        },
        'signalement': {
            label: 'Signalement',
            description: 'Pour signaler un abus ou un incident, veuillez cliquer sur le bouton et fournir les preuves.',
            emoji: '🚨',
            style: ButtonStyle.Danger, // Rouge
            color: '#ED4245',
            categoryId: '1454791978041479188', 
            logChannelId: '1454792059016712298', 
            modalTitle: 'Signalement Incident',
            fields: [
                { id: 'accuse', label: 'Personne(s) signalée(s)', style: TextInputStyle.Short },
                { id: 'date_heure', label: 'Date et Heure des faits', style: TextInputStyle.Short },
                { id: 'faits', label: 'Description des faits', style: TextInputStyle.Paragraph },
                { id: 'preuves', label: 'Liens vers preuves (Rec/Screen)', style: TextInputStyle.Paragraph }
            ]
        }
    }
};

// ==========================================
//           DEFINITION DE LA COMMANDE
// ==========================================
const TICKET_COMMAND_DATA = new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Commandes du système de tickets')
    .addSubcommand(sub => 
        sub.setName('panel')
           .setDescription('Afficher un panel de ticket spécifique (Admin)')
           .addStringOption(option => 
               option.setName('type')
                     .setDescription('Le type de ticket à afficher')
                     .setRequired(true)
                     .addChoices(
                         { name: 'Accréditation', value: 'accreditation' },
                         { name: 'Rendez-vous', value: 'rdv' },
                         { name: 'Signalement', value: 'signalement' }
                     )
           )
    )
    .addSubcommand(sub => 
        sub.setName('close').setDescription('Fermer le ticket (rend invisible au créateur)')
    )
    .addSubcommand(sub => 
        sub.setName('delete').setDescription('Supprimer définitivement le ticket (avec sauvegarde)')
    )
    .addSubcommand(sub => 
        sub.setName('claim').setDescription('Prendre en charge le ticket (accès exclusif)')
    )
    .addSubcommand(sub => 
        sub.setName('unclaim').setDescription('Libérer le ticket (redonne l\'accès au staff)')
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
//           GENERATEUR HTML (Avec support Embeds)
// ==========================================
function generateHTML(messages, channelName, closerTag, ticketType) {
    const reversedMessages = Array.from(messages.values()).reverse();
    
    let itemsHtml = reversedMessages.map(m => {
        const author = m.author;
        const date = new Date(m.createdTimestamp).toLocaleString('fr-FR');
        const avatarUrl = author.displayAvatarURL({ extension: 'png', size: 64 });
        
        // Contenu Texte
        let contentHtml = "";
        if (m.content) {
            contentHtml = `<div class="text">${m.content.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</div>`;
        }

        // Contenu Embeds
        let embedsHtml = "";
        if (m.embeds.length > 0) {
            embedsHtml = m.embeds.map(embed => {
                let fieldsHtml = embed.fields.map(f => `
                    <div class="embed-field">
                        <div class="embed-field-name">${f.name}</div>
                        <div class="embed-field-value">${f.value.replace(/\n/g, "<br>")}</div>
                    </div>
                `).join('');
                
                let descHtml = embed.description ? `<div class="embed-desc">${embed.description.replace(/\n/g, "<br>")}</div>` : '';
                let titleHtml = embed.title ? `<div class="embed-title">${embed.title}</div>` : '';
                
                const colorHex = embed.color ? `#${embed.color.toString(16).padStart(6, '0')}` : '#2f3136';

                return `
                <div class="embed" style="border-left: 4px solid ${colorHex}">
                    ${titleHtml}
                    ${descHtml}
                    <div class="embed-fields">${fieldsHtml}</div>
                </div>`;
            }).join('');
        }
        
        // Pièces jointes
        let attachmentsHtml = "";
        if (m.attachments.size > 0) {
            attachmentsHtml = `<div class="attachments">
                ${m.attachments.map(a => `<a href="${a.url}" target="_blank">📎 Pièce jointe: ${a.name}</a>`).join('<br>')}
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
                ${contentHtml}
                ${embedsHtml}
                ${attachmentsHtml}
            </div>
        </div>`;
    }).join('');

    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Transcript - ${channelName}</title><style>
        body{background-color:#36393f;color:#dcddde;font-family:sans-serif;padding:20px}
        .header{border-bottom:1px solid #2f3136;padding-bottom:20px;margin-bottom:20px}
        .message-group{display:flex;margin-bottom:20px}
        .avatar{width:50px;height:50px;border-radius:50%;overflow:hidden;margin-right:15px;flex-shrink:0}
        .avatar img{width:100%;height:100%}
        .username{font-weight:600}
        .timestamp{color:#72767d;font-size:12px;margin-left:5px}
        .attachments a{color:#00b0f4}
        .embed { background-color: #2f3136; padding: 10px; border-radius: 4px; margin-top: 5px; max-width: 500px; }
        .embed-title { font-weight: bold; color: #fff; margin-bottom: 5px; }
        .embed-desc { color: #dcddde; margin-bottom: 10px; font-size: 14px; }
        .embed-field { margin-bottom: 8px; }
        .embed-field-name { font-weight: bold; color: #fff; font-size: 13px; }
        .embed-field-value { color: #dcddde; font-size: 13px; }
    </style></head><body><div class="header"><h1>#${channelName}</h1><p>Catégorie: ${ticketType}<br>Action par: ${closerTag}</p></div><div class="messages">${itemsHtml}</div></body></html>`;
}

// ==========================================
//             FONCTIONS INTERNES
// ==========================================

async function createTicket(interaction, typeKey, formData) {
    const typeConfig = CONFIG.TICKET_TYPES[typeKey];
    const guild = interaction.guild;
    const user = interaction.user;
    const client = interaction.client;
    
    const channelName = `${typeKey}-${user.username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;

    // --- CONSTRUCTION DES PERMISSIONS ---
    // Par défaut : @everyone (non), User (oui), Staff Global (oui), Bot (oui)
    const permissionOverwrites = [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] },
        { id: CONFIG.STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels] }
    ];

    // --- AJOUT DES RÔLES SPECIFIQUES POUR SIGNALEMENT ---
    if (typeKey === 'signalement') {
        const extraRoles = ["1452256459055431754", "1452256518547181610"];
        extraRoles.forEach(roleId => {
            permissionOverwrites.push({
                id: roleId,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
            });
        });
    }

    try {
        const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: typeConfig.categoryId,
            topic: `${user.id}`, 
            permissionOverwrites: permissionOverwrites
        });

        // --- Embed Archivage ---
        const archiveEmbed = new EmbedBuilder()
            .setTitle('📁 Archivage dans les serveurs SCI.PNET - Justice')
            .setDescription('***⚠️ Cette communication a été automatiquement enregistrée dans les bases de données sécurisées de SCI.PNET sous la supervision de la Justice. Toute tentative de suppression ou d’altération est strictement interdite. ⚠️***')
            .setColor(0xFFFFFF)
            .setFooter({ text: 'JI - JUDEX', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        // --- Embed Info Ticket ---
        const embed = new EmbedBuilder()
            .setColor(typeConfig.color || '#5865F2')
            .setTitle(`${typeConfig.emoji} Nouveau Ticket : ${typeConfig.label}`)
            .setDescription(`Ticket ouvert par <@${user.id}>`)
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

        if (formData && Array.isArray(formData)) {
            formData.forEach(field => {
                if (field.value && field.value.trim() !== "") {
                    embed.addFields({ name: field.name, value: field.value, inline: false });
                }
            });
        }

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_claim_ticket').setLabel('Prendre en charge').setEmoji('🙋‍♂️').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('btn_close_ticket').setLabel('Fermer').setEmoji('🔒').setStyle(ButtonStyle.Danger)
        );

        await channel.send({ content: `<@${user.id}> | <@&${CONFIG.STAFF_ROLE_ID}>`, embeds: [archiveEmbed, embed], components: [buttons] });
        await interaction.reply({ content: `✅ Ticket créé avec succès : ${channel}`, ephemeral: true });

    } catch (error) {
        console.error("Erreur création ticket:", error);
        await interaction.reply({ content: "❌ Erreur création ticket. Vérifiez les IDs de catégorie et permissions.", ephemeral: true });
    }
}

async function handleClaim(interaction) {
    if (interaction.isButton()) {
        // Pas de defer tout de suite car on fait un update
    } else {
        await interaction.deferReply();
    }

    const user = interaction.user;
    const channel = interaction.channel;
    const creatorId = channel.topic; 

    // 1. Donner la permission exclusive à celui qui claim
    await channel.permissionOverwrites.edit(user.id, { 
        ViewChannel: true, 
        SendMessages: true 
    });

    // 2. Retirer la permission de parler au rôle Staff
    await channel.permissionOverwrites.edit(CONFIG.STAFF_ROLE_ID, { 
        ViewChannel: true,  
        SendMessages: false 
    });

    // 3. S'assurer que le créateur peut toujours parler
    if (creatorId) {
        await channel.permissionOverwrites.edit(creatorId, { 
            ViewChannel: true, 
            SendMessages: true 
        });
    }

    // 4. Si c'est un bouton, on met à jour le message pour retirer le bouton "Claim"
    if (interaction.isButton() && interaction.customId === 'btn_claim_ticket') {
        const newRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_close_ticket').setLabel('Fermer').setEmoji('🔒').setStyle(ButtonStyle.Danger)
        );
        
        const originalEmbeds = interaction.message.embeds;
        const originalContent = interaction.message.content;

        await interaction.update({ 
            content: originalContent,
            embeds: originalEmbeds,
            components: [newRow] 
        });
    } else {
        if (interaction.isChatInputCommand()) await interaction.editReply("Ticket pris en charge.");
    }

    const embed = new EmbedBuilder()
        .setDescription(`✅ **Ticket pris en charge exclusivement par <@${user.id}>**.\nSeul ce membre du staff peut répondre désormais.`)
        .setColor('#FEE75C');
    
    await channel.send({ embeds: [embed] });
}

async function handleUnclaim(interaction) {
    if (interaction.isButton()) await interaction.deferUpdate();
    else await interaction.deferReply();

    const channel = interaction.channel;
    
    await channel.permissionOverwrites.edit(CONFIG.STAFF_ROLE_ID, { 
        ViewChannel: true, 
        SendMessages: true 
    });

    await channel.permissionOverwrites.delete(interaction.user.id).catch(() => {});

    const embed = new EmbedBuilder()
        .setDescription(`🔓 **Ticket libéré par <@${interaction.user.id}>**.\nTout le staff peut à nouveau répondre.`)
        .setColor('#5865F2');
    
    await channel.send({ embeds: [embed] });
    if (interaction.isChatInputCommand()) await interaction.editReply("Ticket libéré.");
}

async function handleClose(interaction) {
    if (interaction.isButton()) await interaction.deferUpdate();
    else await interaction.deferReply();

    const channel = interaction.channel;
    const creatorId = channel.topic; 
    
    if (creatorId) {
        await channel.permissionOverwrites.edit(creatorId, { ViewChannel: false }).catch(() => {});
    }

    const embed = new EmbedBuilder()
        .setTitle('🔒 Ticket Fermé')
        .setDescription("Le ticket est fermé et invisible pour le créateur.\n**Appuyez sur Supprimer pour sauvegarder et effacer.**")
        .setColor('#ED4245');

    const deleteRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_delete_ticket').setLabel('Supprimer définitivement').setEmoji('🗑️').setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [embed], components: [deleteRow] });
    if (interaction.isChatInputCommand()) await interaction.editReply("Ticket fermé.");
}

async function handleDelete(interaction) {
    if (interaction.isButton()) await interaction.deferUpdate();
    else await interaction.deferReply();

    const channel = interaction.channel;
    const client = interaction.client;
    
    // DEBUG : Voir si on arrive ici
    console.log(`[TICKET] Tentative suppression ticket: ${channel.name} (Parent: ${channel.parentId})`);

    await channel.send("💾 **Sauvegarde du transcript et suppression...**");

    // 1. Identifier le type de ticket via la catégorie parente
    let ticketTypeKey = null;
    let categoryName = "Autre";
    
    for (const [key, value] of Object.entries(CONFIG.TICKET_TYPES)) {
        if (channel.parentId === value.categoryId) {
            ticketTypeKey = key;
            categoryName = value.label;
            break;
        }
    }

    if (!ticketTypeKey) {
        console.error(`[TICKET ERROR] Le channel ${channel.name} n'est dans aucune catégorie connue de la CONFIG.`);
        // On continue quand même pour supprimer, mais on ne pourra pas envoyer de log
    }

    // 2. Génération du HTML
    const messages = await channel.messages.fetch({ limit: 100 });
    const htmlContent = generateHTML(messages, channel.name, interaction.user.tag, categoryName);
    const buffer = Buffer.from(htmlContent, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.html` });

    // 3. Envoi Log (FORCE FETCH)
    if (ticketTypeKey) {
        const logChannelId = CONFIG.TICKET_TYPES[ticketTypeKey].logChannelId;
        
        try {
            // On force le fetch pour être sûr de trouver le salon même s'il n'est pas en cache
            const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
            
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
                console.log(`[TICKET] Log envoyé dans ${logChannel.name}`);
            } else {
                console.error(`[TICKET ERROR] Impossible de trouver le salon de logs ID: ${logChannelId}`);
            }
        } catch (err) {
            console.error("[TICKET ERROR] Erreur lors de l'envoi du log :", err);
        }
    }

    // 4. Suppression
    // Délai pour laisser le temps d'upload du fichier avant de supprimer
    setTimeout(() => channel.delete().catch(() => {}), 4000);
}

// ==========================================
//           EXPORTS POUR INDEX.JS
// ==========================================

module.exports = {
    data: TICKET_COMMAND_DATA,
    CONFIG,
    
    // 1. Gestion des Slash Commands (/ticket ...)
    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand();
        const channel = interaction.channel;

        // --- PANEL DE TICKETS (UNIQUE PAR TYPE) ---
        if (subCommand === 'panel') {
            const typeKey = interaction.options.getString('type');
            const config = CONFIG.TICKET_TYPES[typeKey];

            if (!config) {
                return interaction.reply({ content: "❌ Type de ticket invalide.", ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(config.color)
                .setTitle(`${config.emoji} ${config.label}`)
                .setDescription(config.description)
                .setFooter({ text: 'Système de Tickets' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`open_ticket_${typeKey}`)
                    .setLabel(config.label)
                    .setEmoji(config.emoji)
                    .setStyle(config.style)
            );

            await interaction.channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: `✅ Panel **${config.label}** créé dans ce salon !`, ephemeral: true });
        }

        // Vérification canal ticket
        if (!channel.name.includes('-') && !channel.name.startsWith('ticket')) {
            return interaction.reply({ content: "❌ Commande utilisable uniquement dans un ticket.", ephemeral: true });
        }

        if (subCommand === 'claim') await handleClaim(interaction);
        else if (subCommand === 'unclaim') await handleUnclaim(interaction); 
        else if (subCommand === 'close') await handleClose(interaction);
        else if (subCommand === 'delete') await handleDelete(interaction);
        else if (subCommand === 'add') {
            const target = interaction.options.getUser('target');
            await channel.permissionOverwrites.edit(target, { ViewChannel: true, SendMessages: true });
            await interaction.reply(`✅ ${target} ajouté.`);
        }
        else if (subCommand === 'remove') {
            const target = interaction.options.getUser('target');
            await channel.permissionOverwrites.edit(target, { ViewChannel: false, SendMessages: false });
            await interaction.reply(`👋 ${target} retiré.`);
        }
    },

    // 2. Gestion des Boutons (Ouverture Modals)
    async handleButtons(interaction) {
        const customId = interaction.customId;

        if (customId.startsWith('open_ticket_')) {
            const typeKey = customId.replace('open_ticket_', '');
            const typeConfig = CONFIG.TICKET_TYPES[typeKey];
            
            if (!typeConfig) return interaction.reply({ content: "Configuration introuvable.", ephemeral: true });

            const modal = new ModalBuilder()
                .setCustomId(`modal_ticket_${typeKey}`)
                .setTitle(typeConfig.modalTitle);

            typeConfig.fields.forEach(field => {
                const input = new TextInputBuilder()
                    .setCustomId(field.id)
                    .setLabel(field.label)
                    .setStyle(field.style)
                    .setRequired(true);
                
                modal.addComponents(new ActionRowBuilder().addComponents(input));
            });

            await interaction.showModal(modal);
        }
        else if (customId === 'btn_claim_ticket') await handleClaim(interaction);
        else if (customId === 'btn_close_ticket') await handleClose(interaction);
        else if (customId === 'btn_delete_ticket') await handleDelete(interaction);
    },

    // 3. Gestion des Modals
    async handleModals(interaction) {
        if (interaction.customId.startsWith('modal_ticket_')) {
            const typeKey = interaction.customId.replace('modal_ticket_', '');
            const typeConfig = CONFIG.TICKET_TYPES[typeKey];

            const formData = [];
            typeConfig.fields.forEach(field => {
                const value = interaction.fields.getTextInputValue(field.id);
                formData.push({ name: field.label, value: value });
            });

            await createTicket(interaction, typeKey, formData);
        }
    }
};

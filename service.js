const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const listeCommand = require('./liste.js'); 

// ID du rôle à donner en PDS et retirer en FDS
const ROLE_EN_SERVICE_ID = "1457068282237423686";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pointeuse')
        .setDescription('Affiche le panel de prise et fin de service (Admin)'),

    async execute(interaction) {
        // Le contrôle de permission se fera dans index.js
        
        const embed = new EmbedBuilder()
            .setTitle('🕰️ Gestion de Service')
            .setDescription('Veuillez indiquer votre statut en cliquant sur les boutons ci-dessous.\n\n🟢 **Prise de Service** : Début de votre activité.\n🔴 **Fin de Service** : Fin de votre activité.')
            .setColor('#2B2D31')
            .setFooter({ text: 'Système de Pointage • JI-JUDEX' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_pds')
                    .setLabel('Prise de Service')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🟢'),
                new ButtonBuilder()
                    .setCustomId('btn_fds')
                    .setLabel('Fin de Service')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔴')
            );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Panel de pointage créé avec succès !', ephemeral: true });
    },

    // Nouvelle fonction pour gérer les clics sur les boutons
    async handleButtons(interaction) {
        // IMPORTANT: On force le rechargement du membre pour avoir ses rôles à jour
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        
        if (!member) {
            return interaction.reply({ content: "❌ Erreur : Impossible de récupérer vos informations membre.", ephemeral: true });
        }

        // On récupère le rôle sur le serveur où l'interaction a lieu
        const role = interaction.guild.roles.cache.get(ROLE_EN_SERVICE_ID);

        // Gestion PRISE DE SERVICE
        if (interaction.customId === 'btn_pds') {
            // 1. Enregistrement dans le fichier (via liste.js)
            await listeCommand.ajouterPDS(interaction.user.tag);

            // 2. Ajout du rôle
            let roleMsg = "";
            if (role) {
                try {
                    // Vérifie si le membre a déjà le rôle pour éviter une erreur API inutile (optionnel mais propre)
                    if (!member.roles.cache.has(role.id)) {
                        await member.roles.add(role);
                        roleMsg = `\n🎭 Rôle **${role.name}** ajouté.`;
                    } else {
                         roleMsg = `\n🎭 Vous aviez déjà le rôle **${role.name}**.`;
                    }
                } catch (error) {
                    console.error(`[ERREUR PDS] Impossible d'ajouter le rôle à ${interaction.user.tag}. Code: ${error.code}, Message: ${error.message}`);
                    roleMsg = "\n⚠️ Impossible d'ajouter le rôle (Vérifiez que le rôle du Bot est au-dessus du rôle 'En Service').";
                }
            } else {
                console.warn(`[ERREUR PDS] Rôle ID ${ROLE_EN_SERVICE_ID} introuvable sur le serveur ${interaction.guild.name}.`);
                roleMsg = "\n⚠️ Rôle 'En Service' introuvable (Mauvais ID dans le code).";
            }

            const embed = new EmbedBuilder()
                .setTitle('🟢 Prise de service')
                .setDescription(`**${interaction.user} a commencé sa PDS.**${roleMsg}`)
                .setColor(0x00cc66)
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Gestion FIN DE SERVICE
        if (interaction.customId === 'btn_fds') {
            // 1. Enregistrement dans le fichier (via liste.js)
            await listeCommand.ajouterFDS(interaction.user.tag);

            // 2. Retrait du rôle
            let roleMsg = "";
            if (role) {
                try {
                    if (member.roles.cache.has(role.id)) {
                        await member.roles.remove(role);
                        roleMsg = `\n🎭 Rôle **${role.name}** retiré.`;
                    } else {
                        roleMsg = `\n🎭 Vous n'aviez pas le rôle **${role.name}**.`;
                    }
                } catch (error) {
                    console.error(`[ERREUR FDS] Impossible de retirer le rôle à ${interaction.user.tag}. Code: ${error.code}, Message: ${error.message}`);
                    roleMsg = "\n⚠️ Impossible de retirer le rôle (Vérifiez la hiérarchie des rôles du bot).";
                }
            } else {
                 console.warn(`[ERREUR FDS] Rôle ID ${ROLE_EN_SERVICE_ID} introuvable.`);
            }

            const embed = new EmbedBuilder()
                .setTitle('🔴 Fin de service')
                .setDescription(`**${interaction.user} a terminé sa FDS.**${roleMsg}`)
                .setColor(0xcc0000)
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};

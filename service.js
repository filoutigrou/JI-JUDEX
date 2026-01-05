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
        // 1. Récupération sécurisée du membre et du rôle
        let member, role;
        
        try {
            member = await interaction.guild.members.fetch(interaction.user.id);
            role = await interaction.guild.roles.fetch(ROLE_EN_SERVICE_ID);
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: `❌ **Erreur Technique** : Impossible de récupérer le membre ou le rôle.\nCode: ${error.message}`, ephemeral: true });
        }

        if (!role) {
            return interaction.reply({ content: `❌ **Erreur Configuration** : Le rôle avec l'ID \`${ROLE_EN_SERVICE_ID}\` n'existe pas sur ce serveur.`, ephemeral: true });
        }

        // --- PRISE DE SERVICE ---
        if (interaction.customId === 'btn_pds') {
            await listeCommand.ajouterPDS(interaction.user.tag);

            let roleMsg = "";
            try {
                if (!member.roles.cache.has(role.id)) {
                    await member.roles.add(role);
                    roleMsg = `\n✅ Rôle **${role.name}** ajouté avec succès.`;
                } else {
                     roleMsg = `\nℹ️ Vous aviez déjà le rôle **${role.name}**.`;
                }
            } catch (error) {
                console.error(`[ERREUR PDS]`, error);
                roleMsg = `\n⚠️ **ÉCHEC AJOUT RÔLE** : Je n'ai pas la permission !\n👉 Vérifiez que le rôle du Bot est placé **au-dessus** du rôle "${role.name}" dans les paramètres du serveur.`;
            }

            const embed = new EmbedBuilder()
                .setTitle('🟢 Prise de service')
                .setDescription(`**${interaction.user} a commencé sa PDS.**${roleMsg}`)
                .setColor(0x00cc66)
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // --- FIN DE SERVICE ---
        if (interaction.customId === 'btn_fds') {
            await listeCommand.ajouterFDS(interaction.user.tag);

            let roleMsg = "";
            try {
                if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                    roleMsg = `\n✅ Rôle **${role.name}** retiré avec succès.`;
                } else {
                    roleMsg = `\nℹ️ Vous n'aviez pas le rôle **${role.name}**.`;
                }
            } catch (error) {
                console.error(`[ERREUR FDS]`, error);
                roleMsg = `\n⚠️ **ÉCHEC RETRAIT RÔLE** : Je n'ai pas la permission !\n👉 Vérifiez que le rôle du Bot est placé **au-dessus** du rôle "${role.name}" dans les paramètres du serveur.`;
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

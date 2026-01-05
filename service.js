const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const listeCommand = require('./liste.js'); 

// ID du rôle à donner en PDS et retirer en FDS
const ROLE_EN_SERVICE_ID = "1457068282237423686";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pointeuse')
        .setDescription('Affiche le panel de prise et fin de service (Admin)'),

    async execute(interaction) {
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

    async handleButtons(interaction) {
        // Force le rechargement du membre pour éviter les bugs de cache
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        const role = interaction.guild.roles.cache.get(ROLE_EN_SERVICE_ID);

        if (!member) {
            return interaction.reply({ content: "❌ Erreur critique : Impossible de récupérer votre profil membre.", ephemeral: true });
        }

        // --- PRISE DE SERVICE ---
        if (interaction.customId === 'btn_pds') {
            await listeCommand.ajouterPDS(interaction.user.tag);

            let roleMsg = "";
            
            if (!role) {
                roleMsg = `\n⚠️ **ERREUR** : Le rôle avec l'ID \`${ROLE_EN_SERVICE_ID}\` n'existe pas sur ce serveur !`;
            } else {
                try {
                    // On essaie d'ajouter le rôle
                    if (!member.roles.cache.has(role.id)) {
                        await member.roles.add(role);
                        roleMsg = `\n✅ Rôle **${role.name}** ajouté avec succès.`;
                    } else {
                        roleMsg = `\nℹ️ Vous aviez déjà le rôle **${role.name}**.`;
                    }
                } catch (error) {
                    console.error("Erreur PDS:", error);
                    // Affiche l'erreur exacte venant de Discord
                    roleMsg = `\n❌ **ÉCHEC AJOUT RÔLE** : \`${error.message}\``;
                }
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

            if (!role) {
                roleMsg = `\n⚠️ **ERREUR** : Le rôle avec l'ID \`${ROLE_EN_SERVICE_ID}\` n'existe pas sur ce serveur !`;
            } else {
                try {
                    // On essaie de retirer le rôle
                    if (member.roles.cache.has(role.id)) {
                        await member.roles.remove(role);
                        roleMsg = `\n✅ Rôle **${role.name}** retiré avec succès.`;
                    } else {
                        roleMsg = `\nℹ️ Vous n'aviez pas le rôle **${role.name}**.`;
                    }
                } catch (error) {
                    console.error("Erreur FDS:", error);
                    // Affiche l'erreur exacte venant de Discord
                    roleMsg = `\n❌ **ÉCHEC RETRAIT RÔLE** : \`${error.message}\``;
                }
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

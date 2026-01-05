const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const listeCommand = require('./liste.js'); // Nécessaire pour enregistrer les heures dans le fichier JSON

// ID du rôle "En Service"
const ROLE_EN_SERVICE_ID = "1457068282237423686";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pointeuse')
        .setDescription('Affiche le panel de prise et fin de service (Admin)'),

    // TA PARTIE VISUELLE (INCHANGÉE)
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

    // LA PARTIE LOGIQUE (AJOUT DU RÔLE)
    async handleButtons(interaction) {
        const member = interaction.member;
        const role = interaction.guild.roles.cache.get(ROLE_EN_SERVICE_ID);

        // --- PRISE DE SERVICE ---
        if (interaction.customId === 'btn_pds') {
            await listeCommand.ajouterPDS(interaction.user.tag);

            let roleMsg = "";
            if (role) {
                try {
                    await member.roles.add(role); // DONNE LE ROLE
                    roleMsg = `\n🎭 Rôle **${role.name}** ajouté.`;
                } catch (error) {
                    console.error("Erreur ajout rôle PDS:", error);
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
            if (role) {
                try {
                    await member.roles.remove(role); // RETIRE LE ROLE
                    roleMsg = `\n🎭 Rôle **${role.name}** retiré.`;
                } catch (error) {
                    console.error("Erreur retrait rôle FDS:", error);
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
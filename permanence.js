const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// ====================================================
// CONFIGURATION : REMPLACE L'ID CI-DESSOUS
// ====================================================
const ROLE_PERMANENCE_ID = "1453851464064565422"; // <--- Mets l'ID du rôle ici

module.exports = {
    // Définition de la commande /permanence
    data: new SlashCommandBuilder()
        .setName('permanence')
        .setDescription('Affiche le panel de gestion des permanences (Admin)'),

    // Exécution de la commande (Création du Panel)
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ Gestion des Permanences')
            .setDescription('Cliquez sur les boutons ci-dessous pour gérer votre statut de permanence.\n\n🔵 **Prise de Permanence** : Vous attribue le rôle.\n⚪ **Fin de Permanence** : Vous retire le rôle.')
            .setColor('#3498db')
            .setFooter({ text: 'Système de Permanence • JI-Judex' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_prise_perm')
                    .setLabel('Prendre ma permanence')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔵'),
                new ButtonBuilder()
                    .setCustomId('btn_fin_perm')
                    .setLabel('Fin de permanence')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⚪')
            );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Panel de permanence créé !', ephemeral: true });
    },

    // Gestion des Boutons
    async handleButtons(interaction) {
        const member = interaction.member;
        const role = interaction.guild.roles.cache.get(ROLE_PERMANENCE_ID);

        // Vérification de sécurité
        if (!role) {
            return interaction.reply({ 
                content: "❌ Erreur : Le rôle de permanence est introuvable ou mal configuré. Contactez un administrateur.", 
                ephemeral: true 
            });
        }

        // --- PRISE DE PERMANENCE ---
        if (interaction.customId === 'btn_prise_perm') {
            if (member.roles.cache.has(role.id)) {
                return interaction.reply({ content: "⚠️ Vous êtes déjà en permanence.", ephemeral: true });
            }

            try {
                await member.roles.add(role);
                return interaction.reply({ 
                    content: `✅ **Prise de permanence validée.** Le rôle **${role.name}** vous a été ajouté.`, 
                    ephemeral: true 
                });
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: "❌ Je n'ai pas la permission de vous donner ce rôle (Vérifiez la hiérarchie des rôles).", ephemeral: true });
            }
        }

        // --- FIN DE PERMANENCE ---
        if (interaction.customId === 'btn_fin_perm') {
            if (!member.roles.cache.has(role.id)) {
                return interaction.reply({ content: "⚠️ Vous n'êtes pas en permanence.", ephemeral: true });
            }

            try {
                await member.roles.remove(role);
                return interaction.reply({ 
                    content: `**Fin de permanence.** Le rôle **${role.name}** vous a été retiré.`, 
                    ephemeral: true 
                });
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: "❌ Je n'ai pas la permission de vous retirer ce rôle.", ephemeral: true });
            }
        }
    }
};
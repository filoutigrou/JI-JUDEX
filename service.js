const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

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
    }
};

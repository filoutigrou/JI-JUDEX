const { 
    SlashCommandBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    EmbedBuilder,
    ChannelType
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rapport')
        .setDescription('Créer et envoyer un rapport de service')
        .addChannelOption(option => 
            option.setName('destination')
                .setDescription('Le salon Forum où envoyer le rapport')
                .addChannelTypes(ChannelType.GuildForum) // Filtre uniquement les salons Forum
                .setRequired(true)
        ),

    async execute(interaction) {
        const selectedChannel = interaction.options.getChannel('destination');

        // On vérifie (même si le filtre le fait déjà) que c'est bien un forum
        if (selectedChannel.type !== ChannelType.GuildForum) {
            return interaction.reply({ content: "❌ Veuillez sélectionner un salon de type **Forum**.", ephemeral: true });
        }

        // On passe l'ID du salon choisi dans l'ID du modal pour le récupérer après
        // Format : rapport_modal_IDDUCHANNEL
        const modal = new ModalBuilder()
            .setCustomId(`rapport_modal_${selectedChannel.id}`)
            .setTitle('📄 Rapport de Service');

        const fields = [
            { id: 'identite', label: 'Matricule & Fonction', style: TextInputStyle.Short, placeholder: 'Ex: 783000 - Agent de Sécurité' },
            { id: 'service', label: 'Service Concerné', style: TextInputStyle.Short, placeholder: 'Ex: Sécurité, Logistique...' },
            { id: 'date', label: 'Date et Heure', style: TextInputStyle.Short, placeholder: 'Ex: 04/01/2026 à 14h30' },
            { id: 'details', label: 'Détails du rapport', style: TextInputStyle.Paragraph, placeholder: 'Expliquez la situation...' },
            { id: 'signature', label: 'Signature', style: TextInputStyle.Short, placeholder: 'Votre Nom/Prénom RP' }
        ];

        const components = fields.map(field => 
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId(field.id)
                    .setLabel(field.label)
                    .setStyle(field.style)
                    .setPlaceholder(field.placeholder || '')
                    .setRequired(true)
            )
        );

        modal.addComponents(...components);
        await interaction.showModal(modal);
    },

    async handleModalSubmit(interaction) {
        // Vérification si c'est bien un modal de rapport
        if (!interaction.customId.startsWith('rapport_modal_')) return;

        // Extraction de l'ID du salon depuis le customId
        const channelId = interaction.customId.replace('rapport_modal_', '');

        // Récupération des données
        const identite = interaction.fields.getTextInputValue('identite');
        const service = interaction.fields.getTextInputValue('service');
        const date = interaction.fields.getTextInputValue('date');
        const details = interaction.fields.getTextInputValue('details');
        const signature = interaction.fields.getTextInputValue('signature');

        // Récupération du salon forum
        const forumChannel = interaction.guild.channels.cache.get(channelId);

        if (!forumChannel) {
            return interaction.reply({ 
                content: "❌ Erreur : Le salon de destination est introuvable.", 
                ephemeral: true 
            });
        }

        // Création de l'embed
        const embed = new EmbedBuilder()
            .setTitle(`📑 Rapport : ${service}`)
            .setColor('#2b2d31')
            .addFields(
                { name: '👤 Identité (Matricule/Fonction)', value: identite, inline: true },
                { name: '🏢 Service', value: service, inline: true },
                { name: '📅 Date & Heure', value: date, inline: false },
                { name: '📝 Détails', value: details, inline: false },
                { name: '✒️ Signature', value: signature, inline: false }
            )
            .setFooter({ text: `Rapport déposé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        try {
            // Création du post dans le forum
            await forumChannel.threads.create({
                name: `Rapport - ${signature} - ${date.split(' ')[0]}`,
                message: {
                    embeds: [embed]
                }
            });

            await interaction.reply({ content: `✅ Votre rapport a été transmis avec succès dans ${forumChannel}.`, ephemeral: true });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "❌ Une erreur est survenue lors de l'envoi du rapport.", ephemeral: true });
        }
    }
};
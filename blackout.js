const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

let maintenanceMode = true;

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackout')
    .setDescription("Affiche l'état actuel du bot et ses performances."),

  async execute(interaction) {
    const uptime = formatUptime(process.uptime());
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

    const embed = new EmbedBuilder()
      .setTitle('🛰️ | État du bot')
      .setDescription(maintenanceMode
        ? '⚠️ **Le bot est actuellement en mode maintenance.** Certaines fonctionnalités peuvent être désactivées.'
        : '✅ **Tout fonctionne normalement.**')
      .setColor(maintenanceMode ? 0xf1c40f : 0x2ecc71)
      .addFields(
        {
          name: '🟢 Statut général',
          value: '_Indique si le bot est en ligne et opérationnel._\n**En ligne**',
          inline: true
        },
        {
          name: '🔧 Mode maintenance',
          value: `_Permet de désactiver certaines fonctions temporairement._\n**${maintenanceMode ? '🛠️ Activé' : '✅ Désactivé'}**`,
          inline: true
        },
        {
          name: '⏱️ Uptime',
          value: `_Durée depuis le dernier redémarrage du bot._\n**${uptime}**`,
          inline: false
        },
        {
          name: '💾 Utilisation mémoire',
          value: `_RAM actuellement utilisée par le processus._\n**${memoryUsage} MB**`,
          inline: false
        }
      )
      .setFooter({ text: 'BLACKOUT STATUS SYSTEM • JI-JUDEX', iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  setMaintenance: (value) => {
    maintenanceMode = value;
  }
};

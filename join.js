const { PermissionsBitField } = require('discord.js');

// Remplacez 'ID_DU_ROLE' par l'ID réel du rôle que vous souhaitez attribuer.
// Pour obtenir l'ID d'un rôle, faites un clic droit sur le rôle dans les paramètres de votre serveur et sélectionnez "Copier l'ID du rôle".
// Assurez-vous que le mode développeur est activé dans vos paramètres Discord.
const NOUVEAU_MEMBRE_ROLE_ID = '1421216858031263786';

async function handleJoin(member) {
  // Vérifie si le bot a la permission de gérer les rôles
  if (!member.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    console.error(`[${new Date().toISOString()}] Erreur : Le bot n'a pas la permission de gérer les rôles.`);
    return;
  }

  // Trouve le rôle à attribuer
  const role = member.guild.roles.cache.get(NOUVEAU_MEMBRE_ROLE_ID);
  if (!role) {
    console.error(`[${new Date().toISOString()}] Erreur : Le rôle avec l'ID '${NOUVEAU_MEMBRE_ROLE_ID}' est introuvable.`);
    return;
  }

  // Vérifie si le rôle du bot est plus élevé que le rôle à attribuer
  if (member.guild.members.me.roles.highest.position <= role.position) {
    console.error(`[${new Date().toISOString()}] Erreur : Le rôle du bot n'est pas assez élevé pour attribuer le rôle '${role.name}'.`);
    return;
  }

  // Attribue le rôle au nouveau membre
  try {
    await member.roles.add(role);
    console.log(`[${new Date().toISOString()}] Le rôle '${role.name}' a été attribué à ${member.user.tag}.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Impossible d'attribuer le rôle à ${member.user.tag}:`, error);
  }
}

module.exports = {
  handleJoin,
};

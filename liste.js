const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const DATA_FILE = path.join(__dirname, 'pds_fds.json');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'filoutigrou';
const REPO = 'NODE-E';
const FILE_PATH = 'pds_fds.json';
const BRANCH = 'main';

let data = { pds: [], fds: [], historique: {} };
if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (err) {
    console.error('Erreur de lecture du fichier pds_fds.json:', err);
  }
}

async function getFileSha() {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });
  if (res.status === 200) {
    const json = await res.json();
    return json.sha;
  } else if (res.status === 404) {
    return null;
  } else {
    throw new Error(`Erreur GitHub API: ${res.status} ${res.statusText}`);
  }
}

async function updateFileOnGitHub(content) {
  const sha = await getFileSha();

  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;

  const body = {
    message: 'Mise à jour automatique de pds_fds.json via bot',
    content: Buffer.from(content).toString('base64'),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Erreur GitHub update: ${res.status} ${res.statusText} - ${JSON.stringify(err)}`);
  }
}

async function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  await updateFileOnGitHub(JSON.stringify(data, null, 2));
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
}

function timeSince(isoDate) {
  const seconds = Math.floor((Date.now() - new Date(isoDate)) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours >= 1) return `${hours} heure${hours > 1 ? 's' : ''}`;
  if (minutes >= 1) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('liste')
    .setDescription('Liste les prises ou fins de service')
    .addSubcommand(sub =>
      sub.setName('pds').setDescription('Affiche la liste des prises de service')
    )
    .addSubcommand(sub =>
      sub.setName('fds').setDescription('Affiche la liste des fins de service')
    ),

  execute: async (interaction) => {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'pds') {
      if (data.pds.length === 0) {
        return interaction.reply({ content: 'Aucune prise de service enregistrée.', flags: 64 });
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 Liste des prises de service')
        .setDescription(
          data.pds.map((item, index) => {
            const historique = data.historique[item.nom];
            const etaitFDS = historique?.dernierFDS ? ` — _était en FDS il y a ${timeSince(historique.dernierFDS)}_` : '';
            return `**${index + 1}.** ${item.nom} *(le ${formatDate(item.date)})*${etaitFDS}`;
          }).join('\n')
        )
        .setColor(0x00cc66)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'fds') {
      if (data.fds.length === 0) {
        return interaction.reply({ content: 'Aucune fin de service enregistrée.', flags: 64 });
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 Liste des fins de service')
        .setDescription(
          data.fds.map((item, index) => {
            const historique = data.historique[item.nom];
            const etaitPDS = historique?.dernierPDS ? ` — _était en PDS il y a ${timeSince(historique.dernierPDS)}_` : '';
            return `**${index + 1}.** ${item.nom} *(le ${formatDate(item.date)})*${etaitPDS}`;
          }).join('\n')
        )
        .setColor(0xcc0000)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },

  ajouterPDS: async (utilisateur) => {
    const now = new Date().toISOString();

  // ✅ S’assurer que data.historique est bien défini
   if (!data.historique) data.historique = {};

    const ancienFDS = data.fds.find(item => item.nom === utilisateur);
    if (ancienFDS) {
      if (!data.historique[utilisateur]) data.historique[utilisateur] = {};
      data.historique[utilisateur].dernierFDS = ancienFDS.date;
    }

    data.fds = data.fds.filter(item => item.nom !== utilisateur);

    if (!data.pds.some(item => item.nom === utilisateur)) {
      data.pds.push({ nom: utilisateur, date: now });
    }

    if (!data.historique[utilisateur]) data.historique[utilisateur] = {};
    data.historique[utilisateur].dernierPDS = now;

    await saveData();
  },

  ajouterFDS: async (utilisateur) => {
    const now = new Date().toISOString();

    // ✅ S’assurer que data.historique est bien défini
    if (!data.historique) data.historique = {};

    const ancienPDS = data.pds.find(item => item.nom === utilisateur);
    if (ancienPDS) {
      if (!data.historique[utilisateur]) data.historique[utilisateur] = {};
      data.historique[utilisateur].dernierPDS = ancienPDS.date;
    }

    data.pds = data.pds.filter(item => item.nom !== utilisateur);

    if (!data.fds.some(item => item.nom === utilisateur)) {
      data.fds.push({ nom: utilisateur, date: now });
    }

    if (!data.historique[utilisateur]) data.historique[utilisateur] = {};
    data.historique[utilisateur].dernierFDS = now;

    await saveData();
  }
};

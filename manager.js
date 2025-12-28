// utils/githubUploader.js
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

async function uploadToGitHub({ filePath, content }) {
  const owner = 'filoutigrou';
  const repo = 'JI-JUDEX';
  const branch = 'main'; // ou la branche par défaut
  const path = `archives/${filePath}`;
  const encodedContent = Buffer.from(content).toString('base64');

  try {
    // Vérifie si le fichier existe déjà
    const { data: existingFile } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    // Mise à jour si le fichier existe
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Mise à jour de ${filePath} par le bot`,
      content: encodedContent,
      sha: existingFile.sha,
      branch,
    });

    console.log(`✅ Fichier ${filePath} mis à jour sur GitHub.`);
  } catch (error) {
    // Création si le fichier n'existe pas
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Création de ${filePath} par le bot`,
      content: encodedContent,
      branch,
    });

    console.log(`✅ Fichier ${filePath} créé sur GitHub.`);
  }
}

module.exports = { uploadToGitHub };

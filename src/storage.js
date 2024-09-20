const { dialog } = require('electron').remote || require('@electron/remote'); // Pour compatibilité si remote n'est pas activé
const { writeFileSync, readFile } = require('fs');
const videoManager = require('./videoManager');
const { renderVideoList } = require('./templates');

const localStorageKey = "video-editor"

// Sauvegarder les données dans localStorage
function saveToLocalStorage(data) {
  localStorage.setItem(localStorageKey, JSON.stringify(data));
}

// Charger les données depuis localStorage
function loadFromLocalStorage() {
  try {
    return JSON.parse(localStorage.getItem(localStorageKey));
  } catch {
    return null
  }
}

// Sauvegarder dans un fichier (exemple pour Node.js, si tu utilises un fichier)
function saveToFile(filename, data) {
  writeFileSync(filename, data);
}

// Fonction pour charger un fichier JSON
function loadFile() {
  // Ouvrir la fenêtre de dialogue pour sélectionner un fichier
  dialog.showOpenDialog({
    title: 'Choisir un fichier vidéo JSON',
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  }).then(result => {
    if (!result.canceled) {
      const filePath = result.filePaths[0]; // Chemin du fichier sélectionné

      // Lire le contenu du fichier
      readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error('Erreur lors de la lecture du fichier:', err);
          return;
        }

        // Charger le JSON dans VideoManager
        try {
          videoManager.load(JSON.parse(data));
          console.log('Vidéos chargées depuis le fichier:', filePath); 
        } catch (error) {
          console.error('Erreur lors du chargement du JSON:', error);
        }
      });
    }
  }).catch(err => {
    console.error('Erreur lors de la sélection du fichier:', err);
  });
}

module.exports = {
  saveToLocalStorage,
  loadFromLocalStorage,
  saveToFile,
  loadFile
};
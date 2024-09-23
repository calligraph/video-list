const path = require('path')
const { dialog } = require('electron').remote || require('@electron/remote'); // Pour compatibilité si remote n'est pas activé
const { writeFileSync, readFile } = require('fs');

// Functions

function fileUrl(filePath, options = {}) {
  if (typeof filePath !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof filePath}`);
	}

	const {resolve = true} = options;
  
	let pathName = filePath;
	if (resolve) {
    pathName = path.resolve(filePath);
	}
  
	pathName = pathName.replace(/\\/g, '/');
  
	// Windows drive letter must be prefixed with a slash.
	if (pathName[0] !== '/') {
    pathName = `/${pathName}`;
	}
  
	// Escape required characters for path components.
	// See: https://tools.ietf.org/html/rfc3986#section-3.3
	return encodeURI(`file://${pathName}`).replace(/[?#]/g, encodeURIComponent);
}

// Drag & drop list
let draggedItem = null;

function handleDragStart(e) {
  draggedItem = e.target;
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  e.preventDefault(); // Nécessaire pour permettre le drop
  e.dataTransfer.dropEffect = 'move'; // Indiquer que l'opération est un déplacement
}

function handleDrop(e) {
  e.preventDefault();
  const targetItem = e.target.closest('.video-item');

  if (targetItem && draggedItem !== targetItem) {
    const draggedIndex = parseInt(draggedItem.dataset.index);
    const targetIndex = parseInt(targetItem.dataset.index);

    // Réorganiser les vidéos dans le VideoManager
    videoManager.reorderVideos(draggedIndex, targetIndex);
  }
}

// Drag & drop files

function dropFiles(e, videoManager) {
    const files = Array.from(e.dataTransfer.files);

    // Filtrer pour ne prendre que les fichiers vidéo
    const videoFiles = files.filter(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        return ['mp4', 'mkv', 'avi'].includes(ext);
    });

    // Ajoute les vidéos sélectionnées à la playlist
    videoFiles.forEach(file => {
        videoManager.addVideo(
            file.name, //title
            file.path, // path 
            enabled = true,
            //cutscenes: [],
        );
    });

    // Mettre à jour l'affichage de la playlist
    videoManager.renderVideoList();
}

function addEventsForDropZone(dropZone) {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
  });

  // Change l'apparence de la zone lors du drag
  ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
          dropZone.classList.add('dragging');
      });
  });

  ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
          dropZone.classList.remove('dragging');
      });
  });
}

// Storage

const localStorageKey = "video-editor"
const localStoragePathKey = 'playlistPath'

// Sauvegarder les données dans localStorage
function saveToLocalStorage(data) {
  localStorage.setItem(localStorageKey, JSON.stringify(data));
}

// Charger les données depuis localStorage
function loadFromLocalStorage() {
  try {
    const data = JSON.parse(localStorage.getItem(localStorageKey));
    data.filePath = localStorage.getItem(localStoragePathKey)
    return data;
  } catch {
    return null
  }
}

// Fonction pour charger un fichier JSON
function loadFile() {
  dialog.showOpenDialog({
    title: 'Choisir un fichier vidéo JSON',
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  }).then(result => {
    if (!result.canceled) {
      const filePath = result.filePaths[0];
      readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error('Erreur lors de la lecture du fichier:', err);
          return;
        }
        try {
          videoManager.load(JSON.parse(data));
          videoManager.filePath = filePath;
          localStorage.setItem('playlistPath', result.filePath);
          document.querySelector('.control-buttons').classList.add('loaded');
          document.querySelector('#playAll').checked = videoManager.playAll;
          document.querySelector('#onlySequences').checked = videoManager.onlySequences;
          document.querySelector('#playlistTitle').innerText = videoManager.title;
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

// Fonction pour ajouter des vidéos à la playlist
function addVideos(videoManager) {
    // Ouvre la boîte de dialogue de sélection de fichiers
  dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Videos', extensions: ['mp4', 'mkv', 'avi'] }]
  }).then(result => {
      if (!result.canceled) {
          const files = result.filePaths;

          files.forEach(file => {
              let titleParts = file.split('/').pop().split(".")
              titleParts.pop()
              let title = titleParts.join(".")
              videoManager.addVideo(title, file, true);
          });

          // Rafraîchir l'affichage après avoir ajouté les vidéos
          videoManager.renderVideoList();
      }
  }).catch(err => {
      console.error('Erreur lors de la sélection des fichiers :', err);
  });
}

function savePlaylist() {
  videoManager.saveToFile(videoManager.currentFilePath)
}

function saveAsPlaylist() {
  dialog.showSaveDialog({
    title: 'Sauvegarder la playlist',
    defaultPath: videoManager.formatTitleForFilename(),
    filters: [{ name: 'JSON', extensions: ['json'] }]
  }).then(result => {
    if (!result.canceled) {
      videoManager.saveToFile(result.filePath);
      localStorage.setItem('playlistPath', result.filePath);
      document.querySelector('.control-buttons').classList.add('loaded');
    }
  }).catch(err => {
      console.error('Erreur lors de l\'ouverture de la boîte de dialogue de sauvegarde :', err);
  });
}

function reset() {
  videoManager.videos = [];
  videoManager.currentVideoIndex = 0;
  videoManager.isPlaying = false;
  videoManager.currentFilePath = null;
  localStorage.removeItem(localStorageKey);
  localStorage.removeItem(localStoragePathKey);
  videoManager.renderVideoList();
  videoManager.renderVideo();
  console.log('VideoManager réinitialisé.');
  document.querySelector('.control-buttons').classList.remove('loaded');
  document.getElementById('videoTimer').textContent = ""
  document.querySelector('#playlistTitle').innerText = "";

}

module.exports = {
  fileUrl,
  handleDragStart,
  handleDragOver,
  handleDrop,
  dropFiles,
  addEventsForDropZone,
  saveToLocalStorage,
  loadFromLocalStorage,
  loadFile,
  addVideos,
  saveAsPlaylist,
  savePlaylist,
  reset,
};
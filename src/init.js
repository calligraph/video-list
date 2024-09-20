const canvas = document.getElementById('sequenceCanvas');
const { loadFile, saveToLocalStorage, loadFromLocalStorage } = require('./storage');
const context = canvas.getContext('2d');
const videoManager = require('./videoManager');
const videoPlayer = document.getElementById('videoPlayer');
const castButton = document.getElementById('castButton');

// Dessiner des séquences de découpe sur le canvas
context.fillStyle = 'green';
context.fillRect(50, 25, 150, 50); // Exemple de séquence

// Chargement automatique des vidéos depuis le localStorage
const savedVideos = loadFromLocalStorage();

if (savedVideos) {
  videoManager.load(savedVideos); // Charger les vidéos si elles existent
  console.log('Vidéos chargées automatiquement depuis localStorage.');
} else {
  console.log('Aucune vidéo dans localStorage, démarrage avec un modèle vide.');
}

// Google Cast SDK pour démarrer le casting
window['__onGCastApiAvailable'] = function(isAvailable) {
    if (isAvailable) {
        initializeCastApi();
    }
};

function initializeCastApi() {
    const castContext = cast.framework.CastContext.getInstance();
    castContext.setOptions({
        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
    });
}

function loadMedia() {
    const castSession = cast.framework.CastContext.getInstance().getCurrentSession();
    const mediaInfo = new chrome.cast.media.MediaInfo('https://www.example.com/video.mp4', 'video/mp4');
    const request = new chrome.cast.media.LoadRequest(mediaInfo);

    // Définir les points de début et de fin pour la séquence
    request.currentTime = 50; // Exemple: Commencer à 50 secondes

    castSession.loadMedia(request).then(() => {
        console.log('Media loaded successfully');
    }).catch((error) => {
        console.error('Error loading media: ' + error);
    });
}

// Activer le casting au clic sur le bouton
castButton.addEventListener('click', loadMedia);

const loadButton = document.getElementById('loadButton');
const saveButton = document.getElementById('saveButton');

loadButton.addEventListener('click', loadFile);

saveButton.addEventListener('click', () => {
    // Simule l'action de sauvegarde
    alert('Sauvegarde des séquences vidéo');
});

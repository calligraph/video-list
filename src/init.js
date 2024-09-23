const { loadFile, saveToLocalStorage, loadFromLocalStorage, addVideos, savePlaylist, dropFiles, addEventsForDropZone } = require('./utils');
const videoManager = require('./videoManager');
const { fullscreen } = require('./templates');
const { SequencesBar } = require('./sequencesBar');

// Elements
const elements = {
  videoPlayer: document.getElementById('videoPlayer'),
  castButton: document.getElementById('castButton'),
  loadButton: document.getElementById('loadButton'),
  saveButton: document.getElementById('saveButton'),
  playAllCheckbox: document.getElementById('playAll'),
  onlySequencesCheckbox: document.getElementById('onlySequences'),
  playPauseButton: document.getElementById('playPauseButton'),
  rewind10sButton: document.getElementById('rewind10sButton'),
  forward10sButton: document.getElementById('forward10sButton'),
  fullscreenButton: document.getElementById('fullscreenButton'),
  addVideosButton: document.getElementById('addVideosButton'),
  sequenceBar: document.getElementById('sequenceBar'),
  dropZone: document.getElementById('dropZone'),
  playlistTitle: document.getElementById('playlistTitle'),
  deleteAfterCurrentButton: document.getElementById('deleteAfterCurrent'),
  deleteBeforeCurrentButton: document.getElementById('deleteBeforeCurrent'),
  cutCurrentButton: document.getElementById('cutCurrent'),
  deleteSequenceButton: document.getElementById('deleteSequenceButton'),
};

// Initialize application
function init() {
  const sequencesBar = new SequencesBar(elements.sequenceBar, videoManager.getCurrentVideo())
  videoManager.setSequencesBar(sequencesBar)
  loadSavedVideos();
  //setupCastApi();
  setupEventListeners();
  addEventsForDropZone(elements.dropZone);
}

// Load saved videos from localStorage
function loadSavedVideos() {
  const savedData = loadFromLocalStorage();
  if (savedData) {
    videoManager.load(savedData);
    elements.playAllCheckbox.checked = videoManager.playAll;
    elements.onlySequencesCheckbox.checked = videoManager.onlySequences;
    elements.playlistTitle.innerText = videoManager.title;
    console.log('Vidéos chargées automatiquement depuis localStorage.');
  } else {
    console.log('Aucune vidéo dans localStorage, démarrage avec un modèle vide.');
  }
}

// Setup Google Cast API
function setupCastApi() {
  window['__onGCastApiAvailable'] = (isAvailable) => {
    if (isAvailable) {
      const castContext = cast.framework.CastContext.getInstance();
      castContext.setOptions({
        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
      });
    }
  };
}

// Load media for casting
function loadMedia() {
  const castSession = cast.framework.CastContext.getInstance().getCurrentSession();
  const mediaInfo = new chrome.cast.media.MediaInfo('https://www.example.com/video.mp4', 'video/mp4');
  const request = new chrome.cast.media.LoadRequest(mediaInfo);
  request.currentTime = 50; // Start at 50 seconds

  castSession.loadMedia(request)
    .then(() => console.log('Media loaded successfully'))
    .catch((error) => console.error('Error loading media: ' + error));
}

// Setup event listeners
function setupEventListeners() {
  //elements.castButton.addEventListener('click', loadMedia);
  elements.addVideosButton.addEventListener('click', () => addVideos(videoManager));
  elements.loadButton.addEventListener('click', () => loadFile(videoManager));
  elements.saveButton.addEventListener('click', savePlaylist);
  elements.playPauseButton.addEventListener('click', () => videoManager.togglePlayPause(videoManager.currentVideoIndex));
  elements.rewind10sButton.addEventListener('click', () => videoManager.rewind10s(getTime()));
  elements.forward10sButton.addEventListener('click', () => videoManager.forward10s(getTime(), getDuration()));
  elements.videoPlayer.addEventListener('timeupdate', () => videoManager.timeUpdate(getTime(), getDuration()));
  elements.videoPlayer.addEventListener('ended', () => videoManager.playNext());
  elements.fullscreenButton.addEventListener('click', fullscreen);
  elements.dropZone.addEventListener('drop', (e) => dropFiles(e, videoManager));
  //elements.addCutButton.addEventListener('click', handleAddCut);
  elements.playAllCheckbox.addEventListener('change', (e) =>  {videoManager.playAll = e.currentTarget.checked})
  elements.onlySequencesCheckbox.addEventListener('change', (e) => {videoManager.onlySequences = e.currentTarget.checked})
  // Titre de la playlist
  elements.playlistTitle.addEventListener('input', (e) => videoManager.setTitle(e.target.innerText).save())
  elements.playlistTitle.addEventListener('blur', (e) => e.target.scrollLeft = 0)
  // Boutons sur les sequences
  elements.deleteAfterCurrentButton.addEventListener('click', () => videoManager.removeSequencesAfter());
  elements.cutCurrentButton.addEventListener('click', () => videoManager.cutCurrentSequence());
  elements.deleteBeforeCurrentButton.addEventListener('click', () => videoManager.removeSequencesBefore());
  elements.deleteSequenceButton.addEventListener('click', () => videoManager.sequencesBar.toggleDeleteMode());
}

// Get current time of the video
function getTime() {
  return elements.videoPlayer.currentTime;
}

// Get duration of the video
function getDuration() {
  return elements.videoPlayer.duration;
}

// Handle adding a cut
function handleAddCut() {
  const video = videoManager.getCurrentVideo();
  if (video.hasCutscenes()) {
    const currentCutscene = video.cutscenes.find(cutscene => video.timeCode >= cutscene.begin && video.timeCode <= cutscene.end);
    if (currentCutscene) {
      splitSequence(video, video.cutscenes.indexOf(currentCutscene), video.timeCode);
    }
  }
}

// Initialize the application
init();

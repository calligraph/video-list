const { fileUrl, handleDragStart, handleDragOver, handleDrop } = require("./utils");

const videoPlayer = document.getElementById('videoPlayer');

// Formater le temps en hh:mm:ss
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (isNaN(hours) || isNaN(mins) || isNaN(secs)) {
    return "";
  }

  return `${hours > 0 ? `${String(hours).padStart(2, '0')}:` : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}  

function fullscreen() {
  if (!document.fullscreenElement) {
    videoPlayer.requestFullscreen(); // Passer en plein écran
  } else {
    document.exitFullscreen(); // Quitter le plein écran
  }
}

function updateCurrentTime(timeCode) {
    videoPlayer.currentTime = timeCode;
}

function renderTime(timeCode, duration) {
    const timerElement = document.getElementById('videoTimer');
    if (timerElement) {
      timerElement.textContent = `${formatTime(timeCode)} / ${formatTime(duration)}`;
    }
}

function playPauseVideo(isPlaying) {
  const playPauseButtonText = document.getElementById('playPauseButton');
  if(isPlaying) {
    videoPlayer.play()
    playPauseButtonText.innerHTML = "◼"
  } else {
    videoPlayer.pause()
    playPauseButtonText.innerHTML = "►"
  }
}

function renderCurrentVideo(video, isPlaying) {
  const path = fileUrl(video.path)
  const currentSrc = videoPlayer.src
  if (currentSrc !== path) {
    videoPlayer.src = path; // Mettre à jour le chemin de la vidéo
    if(isPlaying) {
      videoPlayer.currentTime = video.timeCode;
      videoPlayer.play()
      video.timeCode
    }
  }
}

function renderVideoItem(videoManager, video, index, isCurrent) {
  const videoItem = document.createElement('li');
  const isPlayed = videoManager.isPlaying
  videoItem.classList.add('video-item');
  videoItem.setAttribute('draggable', true);
  videoItem.dataset.index = index;  // Assigner correctement l'index ici
  if (isCurrent) {
    videoItem.classList.add('current');
  }
  if (isPlayed) {
    videoItem.classList.add('playing');
  }

  // Bouton play/stop
  const playButton = document.createElement('span');
  playButton.classList.add('play-button');
  playButton.addEventListener('click', () => {
    videoManager.togglePlayPause(index);
  });
  videoItem.appendChild(playButton);

  // Ajouter le titre de la vidéo et la rendre cliquable
  const title = document.createElement('span');
  title.classList.add('title');
  title.innerText = video.title;
  title.title = video.title; // Tooltip pour afficher le titre complet
  title.setAttribute('contenteditable', 'true')

  //-- À chaque modification du texte, on met à jour le titre dans l'objet vidéo
  title.addEventListener('input', (e) => {
    video.title = e.target.innerText; // Met à jour le titre dans l'objet video
    videoManager.save(); // Sauvegarde de la liste des vidéos
  });

  //-- Lorsque l'édition est terminée (on sort du champ), on remet le style d'ellipsis
  title.addEventListener('blur', () => {
    title.scrollLeft = 0; // Remet le texte à zéro après l'édition
  });

  videoItem.appendChild(title);

  // Ajouter la case à cocher et le bouton de suppression (comme avant)
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = video.enabled;
  checkbox.addEventListener('change', (e) => {
    e.preventDefault()
    e.stopPropagation();
    video.enabled = checkbox.checked;
  });
  videoItem.appendChild(checkbox);

  const deleteButton = document.createElement('fluent-button');
  deleteButton.innerText = '🗑';
  deleteButton.addEventListener('click', () => {
    videoManager.removeVideo(index);
  });
  videoItem.appendChild(deleteButton);

  // Ajouter des événements de drag-and-drop
  videoItem.addEventListener('dragstart', handleDragStart);
  videoItem.addEventListener('dragover', handleDragOver);
  videoItem.addEventListener('drop', handleDrop);

  // Ajouter l'élément de la vidéo dans la liste
  return videoItem;

}

function renderVideoList(videoManager, videos, currentIndex) {
  const videoListContainer = document.getElementById('videoList');
  videoListContainer.innerHTML = ''; // Vider l'ancienne liste

  videos.forEach((video, index)=>{
    videoListContainer.appendChild(renderVideoItem(videoManager, video, index, index===currentIndex))
  })
}

module.exports = {
  renderCurrentVideo,
  renderVideoItem,
  renderVideoList,
  renderTime,
  updateCurrentTime,
  fullscreen,
  playPauseVideo,
};
function renderCurrentVideo(video, timeCode) {
  const videoPlayer = document.getElementById('videoPlayer');
  videoPlayer.src = video.path; // Mettre à jour le chemin de la vidéo
  //videoPlayer.src = 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4';

  const scenesContainer = document.getElementById('scenesContainer');

  // Parcourir les cutscenes et les afficher
  video.cutscenes.forEach((cutscene, index) => {
    const cutsceneItem = document.createElement('div');
    cutsceneItem.classList.add('cutscene-item');

    // Afficher les timestamps des cutscenes
    const cutsceneText = document.createElement('span');
    cutsceneText.innerText = `Début: ${cutscene.begin} - Fin: ${cutscene.end}`;
    cutsceneItem.appendChild(cutsceneText);

    // Ajouter un bouton pour supprimer la cutscene
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Supprimer';
    deleteButton.addEventListener('click', () => {
      video.removeCutscene(index); // Supprime la cutscene du modèle
    });
    cutsceneItem.appendChild(deleteButton);

    // Ajouter un bouton pour fusionner les cutscenes
    if (index > 0 && video.cutscenes[index - 1].end >= cutscene.begin - 1) {
      const mergeButton = document.createElement('button');
      mergeButton.innerText = 'Fusionner';
      mergeButton.addEventListener('click', () => {
        video.cutscenes[index - 1].mergeWith(cutscene);
        video.removeCutscene(index); // Supprime la deuxième cutscene fusionnée
        renderCurrentVideo(video); // Re-rendre la vidéo courante
      });
      cutsceneItem.appendChild(mergeButton);
    }

    // Ajouter l'élément cutscene à la scène
    scenesContainer.appendChild(cutsceneItem);
  });
}

function renderVideoItem(video, index, isCurrent) {
  const videoItem = document.createElement('li');
  videoItem.classList.add('video-item');
  if (isCurrent) {
    videoItem.classList.add('current');
  }

  // Ajouter le titre de la vidéo et la rendre cliquable
  const title = document.createElement('span');
  title.innerText = video.title;
  videoItem.appendChild(title);

  // Rendre la vidéo cliquable pour la rendre courante
  title.addEventListener('click', () => {
    videoManager.changeCurrentVideo(index); // Met à jour l'affichage de la vidéo courante
  });

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

  const deleteButton = document.createElement('button');
  deleteButton.innerText = 'Supprimer';
  deleteButton.addEventListener('click', () => {
    videoManager.removeVideo(index);
  });
  videoItem.appendChild(deleteButton);

  // Ajouter l'élément de la vidéo dans la liste
  return videoItem;

}

function renderVideoList(videos, currentIndex) {
  const videoListContainer = document.getElementById('videoList');
  videoListContainer.innerHTML = ''; // Vider l'ancienne liste

  videos.forEach((video, index)=>{
    videoListContainer.appendChild(renderVideoItem(video, index, index===currentIndex))
  })
}

module.exports = {
  renderCurrentVideo,
  renderVideoItem,
  renderVideoList
};
const { renderVideoList, renderCurrentVideo } = require("./templates");

class Cutscene {
  constructor(begin, end) {
    this.begin = begin;
    this.end = end;
  }

  // Vérifie si deux scènes peuvent être fusionnées (par exemple, si elles se chevauchent ou sont adjacentes)
  canMergeWith(otherScene) {
    return this.end >= otherScene.begin - 1; // Permet de fusionner si la fin de cette scène est juste avant ou se chevauche avec l'autre
  }

  // Fusionne deux scènes adjacentes
  mergeWith(otherScene) {
    this.end = Math.max(this.end, otherScene.end); // Fusionne les fins
  }
}

class Video {
  constructor(title, path, enabled = true, cutscenes = []) {
    this.title = title;
    this.path = path;
    this.enabled = enabled; // Nouveau paramètre pour activer/désactiver la vidéo
    this.cutscenes = cutscenes.map(scene => new Cutscene(scene.begin, scene.end)); // Convertir en objets Cutscene
  }

  // Ajouter une nouvelle séquence à la vidéo
  addCutscene(begin, end) {
    this.cutscenes.push(new Cutscene(begin, end));
  }

  // Supprimer une séquence de la vidéo par son index
  removeCutscene(index) {
    this.cutscenes.splice(index, 1);
  }

  // Modifier une séquence existante
  modifyCutscene(index, newBegin, newEnd) {
    if (this.cutscenes[index]) {
      this.cutscenes[index].begin = newBegin;
      this.cutscenes[index].end = newEnd;
    }
  }

  // Fusionner deux séquences si elles sont adjacentes
  mergeCutscenes() {
    for (let i = 0; i < this.cutscenes.length - 1; i++) {
      const currentScene = this.cutscenes[i];
      const nextScene = this.cutscenes[i + 1];

      if (currentScene.canMergeWith(nextScene)) {
        currentScene.mergeWith(nextScene);
        this.cutscenes.splice(i + 1, 1); // Supprime la scène fusionnée
        i--; // Reviens une position en arrière pour vérifier la prochaine fusion possible
      }
    }
  }
}

class VideoManager {
  constructor() {
    if (VideoManager.instance) {
      return VideoManager.instance; // Renvoie la même instance
    }
    this.videos = [];
    this.currentVideoIndex = 1;
    this.currentTimecode = 1;
    VideoManager.instance = this;
  }

  // Ajouter une vidéo
  addVideo(title, path, enabled = true) {
    const video = new Video(title, path, enabled);
    this.videos.push(video);
  }

  // Supprimer une vidéo
  removeVideo(index) {
    if(index<this.currentVideoIndex) {
      this.currentVideoIndex--;
    } else if (index===this.currentVideoIndex) {
      this.currentVideoIndex = 0;
    }
    this.videos = this.videos.filter((video, current) => current !== index);
    videoManager.renderVideoList();
    saveToLocalStorage(this.toExternal());

  }

  // Supprimer une vidéo
  changeCurrentVideo(index) {
    console.log();
    this.currentVideoIndex = index
    this.currentTimecode = 0
    renderCurrentVideo(this.videos[this.currentVideoIndex], this.currentTimecode);
    this.renderVideoList();
  }

  // Trouver une vidéo par son titre
  findVideo(title) {
    return this.videos.find(video => video.title === title);
  }

  // Récupérer la structure JSON
  toExternal() {
    return ({ 
      videos: this.videos,
      currentVideoIndex: this.currentVideoIndex,
      currentTimecode: this.currentTimecode
    });
  }

  // Charger des vidéos à partir d'un objet JSON
  loadFromExternal(data) {
    try {
      this.videos = data.videos.map(video => new Video(video.title, video.path, video.enabled, video.cutscenes));
      this.currentVideoIndex = this.currentVideoIndex
      this.currentTimecode = this.currentTimecode
    } catch (error) {
      console.error('Erreur de chargement depuis JSON:', error);
    }
  }
  load(data) {
    this.loadFromExternal(data)
    this.renderVideoList()
    saveToLocalStorage(this.toExternal());
  }
  renderVideoList() {
    renderVideoList(this.videos, this.currentVideoIndex)
  }
}

module.exports = new VideoManager(); // Exporte une instance unique

const { renderVideoList, renderCurrentVideo, renderTime, updateCurrentTime, playPauseVideo } = require("./templates");

class Cutscene {
  constructor(begin, end) {
    this.begin = begin;
    this.end = end;
  }

  canMergeWith(otherScene) {
    return this.end >= otherScene.begin - 1;
  }

  mergeWith(otherScene) {
    this.end = Math.max(this.end, otherScene.end);
  }
}

class Video {
  constructor(title, path, enabled = true, timeCode = 0, duration = 0, cutscenes = []) {
    this.title = title;
    this.path = path;
    this.enabled = enabled;
    this.timeCode = timeCode;
    this.duration = duration;
    this.cutscenes = cutscenes.map(scene => new Cutscene(scene.begin, scene.end));
  }

  getBegin() {
    return this.cutscenes[0].begin ? Math.ceil(this.cutscenes[0].begin) : 0
  }

  getSceneAt(timeCode) {
    return this.cutscenes.find( scene => {
      return scene.begin<=timeCode && scene.end>=timeCode
    });
  }

  ensureMinimalCutsceneIfAvailable() {
    if (this.duration > 0 && this.cutscenes.length === 0) {
      this.cutscenes.push(new Cutscene(0, this.duration));
    }
  }

  ensureBounding(scene) {
    const index = this.cutscenes.indexOf(scene)
    if(index === 0) {
      scene.begin = Math.max(0, scene.begin)
    }
    if(index === this.cutscenes.length - 1) {
      scene.end = Math.min(this.duration, scene.end)
    }
    if (index > 0) {
      const prev = this.cutscenes[index-1]
      scene.begin = Math.max(prev.end, scene.begin)
    }
    if (index < this.cutscenes.length - 1) {
      const next = this.cutscenes[index+1]
      scene.end = Math.min(next.begin, scene.end)
    }
  }

  isInScenes(timeCode) {
    return this.getSceneAt(timeCode) !== undefined;
  }

  nextStart(timeCode) {
    return this.cutscenes.find( scene => scene.begin>=timeCode)?.begin
  }

  hasCutscenes() {
    return this.cutscenes.length > 0;
  }

  addCutscene(begin, end) {
    this.cutscenes.push(new Cutscene(begin, end));
  }

  removeCutscene(index) {
    this.cutscenes.splice(index, 1);
  }
  
  splitSequence(cutPoint) {
    console.log("remove after", this.getSceneAt(cutPoint));
    if( ! this.isInScenes(cutPoint)) {
      return;
    }
    const sequence = this.getSceneAt(cutPoint)
    const index = this.cutscenes.findIndex(s=>s===sequence)
    const newSequence =  new Cutscene(cutPoint, sequence.end);
    sequence.end = cutPoint;
    this.cutscenes.splice(index+1, 0, newSequence);
  }

  removeSequencesAfter(timeCode) {
    this.splitSequence(timeCode)
    this.cutscenes = this.cutscenes.filter(scene => scene.begin < timeCode);
  }


  mergeScenes() {
    for (let i = 0; i < this.cutscenes.length - 1; i++) {
      const currentScene = this.cutscenes[i];
      const nextScene = this.cutscenes[i + 1];

      if (currentScene.canMergeWith(nextScene)) {
        currentScene.mergeWith(nextScene);
        this.cutscenes.splice(i + 1, 1);
        i--;
      }
    }
  }  
}

class VideoManager {
  constructor() {
    if (VideoManager.instance) {
      return VideoManager.instance;
    }
    this.videos = [];
    this.currentVideoIndex = 0;
    this.isPlaying = false;
    VideoManager.instance = this;
    this.sequencesBar = null
    this.onlySequences = true
    this.playAll = true
    this.title = "Titre de la playlist";
  }

  setSequencesBar(sequencesBar) {
    this.sequencesBar = sequencesBar;
  }

  setTitle(title) {
    this.title = title;
    return this;
  }

  addVideo(title, path, enabled = true) {
    const video = new Video(title, path, enabled);
    this.videos.push(video);
    this.save();
  }

  removeVideo(index) {
    if (index < this.currentVideoIndex) {
      this.currentVideoIndex--;
    } else if (index === this.currentVideoIndex) {
      this.currentVideoIndex = 0;
    }
    this.videos.splice(index, 1);
    this.renderVideoList();
    this.save();
  }

  reorderVideos(fromIndex, toIndex) {
    const movedVideo = this.videos.splice(fromIndex, 1)[0];
    this.videos.splice(toIndex, 0, movedVideo);
    this.renderVideoList();
    this.save();
  }

  getVideo(index) {
    return this.videos[index];
  }

  getCurrentVideo() {
    return this.getVideo(this.currentVideoIndex);
  }

  setVideo(index, timeCode, isPlaying) {
    this.currentVideoIndex = index;
    const video = this.getVideo(index);
    this.isPlaying = isPlaying;
    video.timeCode = timeCode;
    this.renderVideo(video);
    playPauseVideo(isPlaying);
    updateCurrentTime(timeCode);
    this.renderVideoList();
    this.save();
  }

  removeSequencesAfter() {
    const video = this.getCurrentVideo();
    video.removeSequencesAfter(video.timeCode);
    this.sequencesBar.render()
  }

  startSequences() {    
    this.setVideo(0, this.getVideo(0).cutscenes[0].begin, true)
  }

  playNext() {
    if(!this.playAll) {
      return;
    }
    const nextIndex = this.currentVideoIndex+1
    if(!this.videos[nextIndex]) {
      return;
    }
    this.getCurrentVideo().timeCode = 0
    const timeCode = this.onlySequences ? this.getVideo(nextIndex).getBegin() : 0
    this.setVideo(nextIndex, timeCode, true)
  }

  controlSequences(time) {
    if(!this.onlySequences) {
      return;
    }
    const video = this.getCurrentVideo();

    if(this.getCurrentVideo().isInScenes(time)) {
      return
    }
    const nextTimeCode = video.nextStart(time)
    if(! nextTimeCode) {
      this.playNext()
      return
    }
    this.setVideo(this.currentVideoIndex, nextTimeCode, true)

  }

  togglePlayPause(index) {
    if (index === undefined) {
      const video = this.getCurrentVideo();
      this.setVideo(this.currentVideoIndex, video.timeCode, this.isPlaying);
    } else if (index !== this.currentVideoIndex) {
      const video = this.getVideo(index);
      this.setVideo(index, video.timeCode, true);
    } else {
      const video = this.getVideo(index);
      this.setVideo(index, video.timeCode, !this.isPlaying);
    }
  }

  rewind10s(time) {
    const video = this.getCurrentVideo();
    video.timeCode = Math.max(0, time - 10);
    updateCurrentTime(video.timeCode);
    this.renderTime();
    this.save();
  }

  forward10s(time, duration) {
    const video = this.getCurrentVideo();
    video.timeCode = Math.min(time + 10, duration);
    updateCurrentTime(video.timeCode);
    this.renderTime();
    this.save();
  }

  timeUpdate(time, duration) {
    const video = this.getCurrentVideo();
    try {
      this.currentTimeCode = time;
      video.timeCode = time;
      video.duration = duration || video.duration;
      video.ensureMinimalCutsceneIfAvailable();
      this.renderTime();
      this.sequencesBar.updateTimeIndicator()
      this.save();
    } catch (e) {
      console.log("error in timeUpdate", e);
    }
    this.controlSequences(time)
  }

  findVideo(title) {
    return this.videos.find(video => video.title === title);
  }

  save() {
    saveToLocalStorage(this.toExternal());
  }

  toExternal() {
    return {
      currentVideoIndex: this.currentVideoIndex,
      onlySequences: this.onlySequences,
      isPlaying: this.isPlaying,
      playAll: this.playAll,
      videos: this.videos,
      title: this.title, // Ajout du titre de la playlist
    };
  }

  loadFromExternal(data) {
    try {    
      this.title = data.title || "Titre de la playlist";
      this.videos = data.videos.map(video => new Video(video.title, video.path, video.enabled, video.timeCode, video.duration, video.cutscenes));
      this.currentVideoIndex = data.currentVideoIndex || 0;
      this.isPlaying = data.isPlaying || false;
      this.playAll = data.playAll || false;
      this.onlySequences = data.onlySequences || false;
    } catch (error) {
      console.error('Erreur de chargement depuis JSON:', error);
    }
  }

  load(data) {
    this.loadFromExternal(data);
    if(this.videos.length<1) {
      return;
    }
    this.renderVideoList();
    this.renderVideo();
    this.save();
  }

  renderTime() {
    renderTime(this.getCurrentVideo().timeCode, this.getCurrentVideo().duration);
  }

  renderVideo() {
    renderCurrentVideo(this.getCurrentVideo(), this.isPlaying);
    this.sequencesBar.setVideo(this.getCurrentVideo()).render()
  }

  renderVideoList() {
    renderVideoList(this, this.videos, this.currentVideoIndex);
  }
}

module.exports = new VideoManager();

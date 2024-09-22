class Resizing {
  constructor (scene, startX, side) {
    this.scene = scene
    this.startX = startX
    this.side = side
  }
}

class SequencesBar {
  constructor(container, video) {
    this.container = container
    this.video = video
    this.resizeSequenceBinded = this.resizeSequence.bind(this);
    this.endResizeBinded = this.endResize.bind(this);
  }

  setVideo(video) {
    this.video = video
    return this
  }

  render() {
    this.container.innerHTML = '';
    let lastEnd = 0;

    this.video.cutscenes.forEach((scene, index) => {
      if (scene.begin > lastEnd) {
        this.addGap(lastEnd, scene.begin);
      }
      this.addSequence(scene, index);
      lastEnd = scene.end;
    });

    this.renderCurrentTimeIndicator();
  }

  addGap(lastEnd, begin) {
    const duration = this.video.duration
    const element = document.createElement('div');
    const gapDuration = begin - lastEnd;
    const widthPercentage = (gapDuration / duration) * 100;
    element.style.width = `${widthPercentage}%`;
    element.style.display = 'inline-block';
    this.container.appendChild(element);
  }


  addSequence(scene, index) {
    const duration = this.video.duration
    const element = document.createElement('div');
    element.classList.add('sequence', index % 2 === 0 ? 'even' : 'odd');
    if (index === this.video.current) {
      element.classList.add('current');
    }

    const sceneDuration = scene.end - scene.begin;
    const widthPercentage = (sceneDuration / duration) * 100;
    element.style.width = `${widthPercentage}%`;
    element.style.display = 'inline-block';

    this.addResizeHandles(element, scene, index);
    
    element.addEventListener('dblclick', (e) => {
      if (e.target === element) {
        const bounding = this.container.getBoundingClientRect();
        const cutPoint = (e.clientX - bounding.x) / bounding.width * this.video.duration + 1;
        console.log(`${cutPoint} = (${e.clientX} - ${bounding.x}) / ${bounding.width} * ${this.video.duration}`)
        console.log(cutPoint)
        this.video.splitSequence(index, cutPoint);
        this.render();
      }
    });

    this.container.appendChild(element);
  }
  // Add resize handles to sequence div
  addResizeHandles(sequenceDiv, scene) {
    const leftResizeHandle = document.createElement('div');
    leftResizeHandle.classList.add('resize-handle', 'left');
    sequenceDiv.appendChild(leftResizeHandle);

    const rightResizeHandle = document.createElement('div');
    rightResizeHandle.classList.add('resize-handle', 'right');
    sequenceDiv.appendChild(rightResizeHandle);

    leftResizeHandle.addEventListener('mousedown', (e) => this.startResize(e, scene, 'left'));
    rightResizeHandle.addEventListener('mousedown', (e) => this.startResize(e, scene, 'right'));
  }

  startResize(e, scene, side) {
    this.resizing = new Resizing(scene, e.clientX, side)

    document.addEventListener('mousemove', this.resizeSequenceBinded);
    document.addEventListener('mouseup', this.endResizeBinded);
  }

  resizeSequence(e) {
    if (!this.resizing) return;
    const {scene, startX, side} = this.resizing
    const bounding = this.container.getBoundingClientRect();
    const currentX = Math.min(Math.max(e.clientX, bounding.x), bounding.x + bounding.width)
    const delta = (currentX - startX) / bounding.width * this.video.duration;
    if (delta !== 0) {
      if (side === 'left') {
        scene.begin += delta;
      } else if (side === 'right') {
        scene.end += delta;
      }
      this.video.ensureBounding(scene)
      this.resizing.startX = currentX;
      this.render();
    }
  }

  endResize() {
    this.resizing = null;
    document.removeEventListener('mousemove', this.resizeSequenceBinded);
    document.removeEventListener('mouseup', this.endResizeBinded);
    this.video.mergeScenes()
    this.render();
  }

  renderCurrentTimeIndicator() {
    this.timeIndicatorContainer = document.createElement('div');
    this.timeIndicatorContainer.classList.add('current-time-indicator');
    this.container.appendChild(this.timeIndicatorContainer);
    this.updateTimeIndicator()
  }

  updateTimeIndicator() {
    const ratio = this.video.timeCode / this.video.duration;
    this.timeIndicatorContainer.style.left = `${ratio * 100}%`;
  }
}

module.exports = {
  SequencesBar
};
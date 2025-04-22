class Note {
  constructor(lane, time, speed) {
    this.lane = lane;
    this.time = time;
    this.speed = speed;
    this.isHit = false;
    this.element = null;
    this.targetY = 250;
    this.fillColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    this.hitTime = null;
    this.noteWidth = 100;
    this.noteHeight = 20;
    this.startNoteY = -this.noteHeight;
    this.x = this.getLaneX(lane);
    this.y = this.startNoteY;
    this.createNote();
  }

  getLaneX(lane) {
    return lane * this.noteWidth;
  }

  createNote() {
    this.element = document.createElement("div");
    this.element.classList.add("note");
    this.element.style.left = this.x + "px";
    this.element.style.top = this.y + "px";
    this.element.style.backgroundColor = this.fillColor;
    this.element.style.width = `${this.noteWidth}px`;
    this.element.style.height = `${this.noteHeight}px`;
    this.element.style.borderRadius = "5px";
    document.getElementById("gameArea").appendChild(this.element);
  }

  update(conductor, hitLineY, gameHeight) {
    if (this.isHit || conductor.isPaused) {
      this.remove();
      return;
    }
    const timeToReachTarget = this.targetY / this.speed;
    const timeElapsed = conductor.songPosition - this.time;
    const visibleTimeElapsed = timeElapsed;
    if (visibleTimeElapsed < -timeToReachTarget) return;
    this.y = this.startNoteY + visibleTimeElapsed * this.speed;
    this.element.style.top = this.y + "px";
    if (this.y > gameHeight) {
      this.remove();
    }
  }

  checkHit(hitY) {
    const perfectWindow = 10;
    const goodWindow = 25;
    const hitWindow = 50;
    const centerY = this.y + this.noteHeight / 2;
    const distance = Math.abs(centerY - hitY);
    let result = "Miss";
    if (distance <= perfectWindow) {
      result = "Perfect";
      this.isHit = true;
    } else if (distance <= goodWindow) {
      result = "Good";
      this.isHit = true;
    } else if (distance <= hitWindow) {
      result = "Hit";
      this.isHit = true;
    }

    return result;
  }

  remove() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
  }
}

export default Note;

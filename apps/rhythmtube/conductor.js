class Conductor {
  constructor(bpm) {
    this.bpm = bpm;
    this.crotchet = 60 / bpm;
    this.songPosition = 0;
    this.startTime = 0;
    this.pausedTime = 0;
    this.isPaused = false;
  }

  start(player) {
    this.startTime = player.getCurrentTime();
    this.isPaused = false;
    this.pausedTime = 0;
  }

  pause(player) {
    if (this.startTime !== 0 && !this.isPaused) {
      this.pausedTime = player.getCurrentTime();
      this.isPaused = true;
    }
  }

  resume(player) {
    if (this.startTime !== 0 && this.isPaused) {
      this.startTime += player.getCurrentTime() - this.pausedTime;
      this.isPaused = false;
    }
  }

  update(player) {
    if (this.startTime !== 0 && !this.isPaused) {
      this.songPosition = player.getCurrentTime() - this.startTime;
    }
  }
}

export default Conductor;

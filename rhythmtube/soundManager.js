class SoundManager {
  constructor() {
    this.soundPools = {
      d: [],
      f: [],
      j: [],
      k: [],
    };
    this.maxSounds = 4;
    this.soundFiles = {
      d: "sound/tr707-kick-drum-241400.mp3",
      f: "sound/tr707-snare-drum-241412.mp3",
      j: "sound/tr909-kick-drum-241402.mp3",
      k: "sound/tr909-snare-drum-241413.mp3",
    };
    this.keyMap = ["d", "f", "j", "k"];
    this.sfxVolume = 0;
  }

  loadSounds() {
    for (const key of this.keyMap) {
      for (let i = 0; i < this.maxSounds; i++) {
        const sound = new Audio(this.soundFiles[key]);
        sound.preload = "auto";
        this.soundPools[key].push(sound);
      }
    }
  }

  playSound(key) {
    if (this.soundPools[key]) {
      const pool = this.soundPools[key];
      const sound = pool[Math.floor(Math.random() * pool.length)];
      sound.currentTime = 0;
      sound.volume = this.sfxVolume;
      sound.play();
    }
  }

  setSfxVolume(volume) {
    this.sfxVolume = volume;
    for (const key in this.soundPools) {
      this.soundPools[key].forEach((sound) => (sound.volume = this.sfxVolume));
    }
  }
}

export default SoundManager;

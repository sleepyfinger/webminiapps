class YouTubePlayer {
  constructor(playerElementId, onReadyCallback, onStateChangeCallback) {
    this.player = null;
    this.playerElementId = playerElementId;
    this.onReadyCallback = onReadyCallback;
    this.onStateChangeCallback = onStateChangeCallback;
    this.originalVolume = 100;
    this.bgmVolume = 1.0;
    this.sfxVolume = 0;
    this.maxVolume = 1.0;
    this.minVolume = 0.0;
    this.isVideoPlaying = false;
    this.videoDuration = 0;
    this.isPlayerReady = false;
  }

  onYouTubeIframeAPIReady() {
    console.log("onYouTubeIframeAPIReady in youtubePlayer.js called");
    this.player = new YT.Player(this.playerElementId, {
      height: "360",
      width: "640",
      videoId: "",
      events: {
        onReady: this.onPlayerReady.bind(this),
        onStateChange: this.onPlayerStateChange.bind(this),
      },
      playerVars: {
        controls: 0,
        disablekb: 1,
        autoplay: 0,
      },
    });
    console.log("this.player:", this.player);
  }

  onPlayerReady(event) {
    console.log("onPlayerReady in youtubePlayer.js called");
    this.originalVolume = this.player.getVolume();
    this.isPlayerReady = true;
    this.onReadyCallback(this);
  }

  onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      this.videoDuration = this.player.getDuration();
      this.isVideoPlaying = true;
    } else if (event.data === YT.PlayerState.PAUSED) {
      this.isVideoPlaying = false;
    } else if (event.data === YT.PlayerState.ENDED) {
      this.isVideoPlaying = false;
    }
    this.onStateChangeCallback(event);
  }

  loadVideoById(videoId, callback) {
    if (!this.isPlayerReady) {
      console.error("Player is not ready.");
      return;
    }
    if (this.player && videoId) {
      this.player.loadVideoById(videoId);
      if (callback) {
        callback();
      }
    } else {
      console.error("Player is not ready or videoId is invalid.");
    }
  }

  setVolume(volume) {
    if (!this.isPlayerReady) {
      console.error("Player is not ready.");
      return;
    }
    if (this.player) {
      this.player.setVolume(volume);
    }
  }

  getVolume() {
    if (!this.isPlayerReady) {
      console.error("Player is not ready.");
      return 0;
    }
    if (this.player) {
      return this.player.getVolume();
    }
    return 0;
  }

  getCurrentTime() {
    if (!this.isPlayerReady) {
      console.error("Player is not ready.");
      return 0;
    }
    if (this.player) {
      return this.player.getCurrentTime();
    }
    return 0;
  }

  setPlaybackRate(rate) {
    if (!this.isPlayerReady) {
      console.error("Player is not ready.");
      return;
    }
    if (this.player) {
      this.player.setPlaybackRate(rate);
    }
  }

  getDuration() {
    if (!this.isPlayerReady) {
      console.error("Player is not ready.");
      return 0;
    }
    if (this.player) {
      return this.player.getDuration();
    }
    return 0;
  }
}

function getVideoIdFromUrl(url) {
  if (!url) return false;
  const regex =
    /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.match(regex);
  return match && match[1].length === 11 ? match[1] : false;
}

export { YouTubePlayer, getVideoIdFromUrl };

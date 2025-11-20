import { Sound, Engine } from '@babylonjs/core';

/**
 * Wrapper class for BabylonJS Sound API
 * Provides a simplified interface for creating and managing sounds
 */
export class SoundWrapper {
  constructor(engine) {
    this.engine = engine;
    this.sound = null;
  }

  /**
   * Create a sound from a URL
   * @param {string} name - Name of the sound
   * @param {string} url - URL to the audio file
   * @param {object} options - Sound options
   * @returns {Promise<SoundWrapper>} - Promise that resolves when sound is ready
   */
  static async createSound(name, url, options = {}) {
    // For testing, we'll use a minimal engine setup
    const wrapper = new SoundWrapper(null);

    return new Promise((resolve, reject) => {
      try {
        wrapper.sound = new Sound(
          name,
          url,
          null, // scene (null for global sounds)
          () => {
            // onReady callback
            resolve(wrapper);
          },
          {
            loop: options.loop || false,
            autoplay: options.autoplay || false,
            volume: options.volume !== undefined ? options.volume : 1.0,
            playbackRate: options.playbackRate || 1.0,
            spatialSound: options.spatialSound || false,
            maxDistance: options.maxDistance || 100,
            ...options
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Play the sound
   */
  play() {
    if (this.sound) {
      this.sound.play();
    }
  }

  /**
   * Stop the sound
   */
  stop() {
    if (this.sound) {
      this.sound.stop();
    }
  }

  /**
   * Pause the sound
   */
  pause() {
    if (this.sound) {
      this.sound.pause();
    }
  }

  /**
   * Check if sound is currently playing
   * @returns {boolean}
   */
  get isPlaying() {
    return this.sound ? this.sound.isPlaying : false;
  }

  /**
   * Check if sound is paused
   * @returns {boolean}
   */
  get isPaused() {
    return this.sound ? this.sound.isPaused : false;
  }

  /**
   * Check if sound is ready
   * @returns {boolean}
   */
  get isReady() {
    return this.sound ? this.sound.isReady() : false;
  }

  /**
   * Set volume
   * @param {number} volume - Volume level (0.0 to 1.0+)
   * @param {number} time - Fade duration in milliseconds
   */
  setVolume(volume, time = 0) {
    if (this.sound) {
      this.sound.setVolume(volume, time);
    }
  }

  /**
   * Get current volume
   * @returns {number}
   */
  getVolume() {
    return this.sound ? this.sound.getVolume() : 0;
  }

  /**
   * Set playback rate
   * @param {number} rate - Playback rate (1.0 is normal speed)
   */
  setPlaybackRate(rate) {
    if (this.sound) {
      this.sound.setPlaybackRate(rate);
    }
  }

  /**
   * Get playback rate
   * @returns {number}
   */
  getPlaybackRate() {
    return this.sound ? this.sound._playbackRate : 1.0;
  }

  /**
   * Set loop mode
   * @param {boolean} loop - Whether to loop
   */
  setLoop(loop) {
    if (this.sound) {
      this.sound.loop = loop;
    }
  }

  /**
   * Get loop mode
   * @returns {boolean}
   */
  getLoop() {
    return this.sound ? this.sound.loop : false;
  }

  /**
   * Set stereo panning
   * @param {number} pan - Pan value (-1 = full left, 0 = center, 1 = full right)
   */
  setPanning(pan) {
    if (this.sound) {
      this.sound.setPanningModel(pan);
    }
  }

  /**
   * Get sound duration
   * @returns {number} - Duration in seconds
   */
  getDuration() {
    return this.sound ? this.sound._duration : 0;
  }

  /**
   * Get current playback time
   * @returns {number} - Current time in seconds
   */
  getCurrentTime() {
    return this.sound ? this.sound.currentTime : 0;
  }

  /**
   * Dispose of the sound and free resources
   */
  dispose() {
    if (this.sound) {
      this.sound.dispose();
      this.sound = null;
    }
  }
}

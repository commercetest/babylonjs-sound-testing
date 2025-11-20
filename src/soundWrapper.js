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
   * Attach an analyzer to the sound for frequency analysis
   * Must be called before playing the sound for optimal performance
   * @returns {boolean} - True if analyzer was attached successfully
   */
  attachAnalyzer() {
    if (this.sound) {
      // BabylonJS Sound has built-in analyzer support
      // Check if the sound has an analyzer method
      if (typeof this.sound.attachToAnalyser === 'function') {
        this.sound.attachToAnalyser();
        return true;
      }
      // Fallback: manually create analyzer if needed
      if (this.sound._audioEngine && this.sound._audioEngine.audioContext) {
        const audioContext = this.sound._audioEngine.audioContext;
        if (!this.sound._analyser) {
          this.sound._analyser = audioContext.createAnalyser();
          this.sound._analyser.fftSize = 2048;

          // Connect the sound source to the analyzer
          if (this.sound._soundSource) {
            this.sound._soundSource.connect(this.sound._analyser);
          }
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Get the analyzer node (Web Audio API AnalyserNode)
   * @returns {AnalyserNode|null} - The analyzer node or null
   */
  getAnalyzer() {
    if (this.sound) {
      // Try BabylonJS built-in analyzer first
      if (this.sound._analyser) {
        return this.sound._analyser;
      }
      // Check if sound has getSoundSource method
      if (typeof this.sound.getSoundSource === 'function') {
        const source = this.sound.getSoundSource();
        if (source && source._analyser) {
          return source._analyser;
        }
      }
    }
    return null;
  }

  /**
   * Get frequency data from the analyzer
   * @returns {Float32Array|null} - Frequency data in dB or null if no analyzer
   */
  getFrequencyData() {
    const analyzer = this.getAnalyzer();
    if (analyzer) {
      const dataArray = new Float32Array(analyzer.frequencyBinCount);
      analyzer.getFloatFrequencyData(dataArray);
      return dataArray;
    }
    return null;
  }

  /**
   * Get byte frequency data from the analyzer
   * @returns {Uint8Array|null} - Frequency data as bytes (0-255) or null if no analyzer
   */
  getByteFrequencyData() {
    const analyzer = this.getAnalyzer();
    if (analyzer) {
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      analyzer.getByteFrequencyData(dataArray);
      return dataArray;
    }
    return null;
  }

  /**
   * Get the sample rate of the audio context
   * @returns {number} - Sample rate in Hz
   */
  getSampleRate() {
    if (this.sound && this.sound._audioEngine && this.sound._audioEngine.audioContext) {
      return this.sound._audioEngine.audioContext.sampleRate;
    }
    return 44100; // Default fallback
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

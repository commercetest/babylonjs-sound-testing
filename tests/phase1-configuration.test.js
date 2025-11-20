import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';

/**
 * Phase 1 Tests: Configuration Properties
 * Tests volume, loop, playback rate, panning, and other configuration options
 */
describe('Phase 1: Configuration Properties', () => {
  let browser;
  let context;
  let page;

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: true,
      args: ['--autoplay-policy=no-user-gesture-required']
    });
    context = await browser.newContext({
      permissions: ['microphone']
    });
    page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    await page.goto('http://localhost:5173/index.html', {
      waitUntil: 'networkidle'
    });
  }, 30000);

  afterAll(async () => {
    await page?.close();
    await context?.close();
    await browser?.close();
  });

  describe('Volume Control', () => {
    it('should set volume correctly', async () => {
      const result = await page.evaluate(() => {
        const wrapper = new window.SoundWrapper(null);

        // Mock sound object with volume support
        wrapper.sound = {
          _volume: 1.0,
          setVolume: function(vol) { this._volume = vol; },
          getVolume: function() { return this._volume; }
        };

        wrapper.setVolume(0.5);
        return wrapper.getVolume();
      });

      expect(result).toBe(0.5);
    });

    it('should handle volume = 0 (mute)', async () => {
      const result = await page.evaluate(() => {
        const wrapper = new window.SoundWrapper(null);

        wrapper.sound = {
          _volume: 1.0,
          setVolume: function(vol) { this._volume = vol; },
          getVolume: function() { return this._volume; }
        };

        wrapper.setVolume(0);
        return wrapper.getVolume();
      });

      expect(result).toBe(0);
    });

    it('should handle volume = 1 (max normal)', async () => {
      const result = await page.evaluate(() => {
        const wrapper = new window.SoundWrapper(null);

        wrapper.sound = {
          _volume: 0.5,
          setVolume: function(vol) { this._volume = vol; },
          getVolume: function() { return this._volume; }
        };

        wrapper.setVolume(1);
        return wrapper.getVolume();
      });

      expect(result).toBe(1);
    });

    it('should handle volume > 1 (amplification)', async () => {
      const result = await page.evaluate(() => {
        const wrapper = new window.SoundWrapper(null);

        wrapper.sound = {
          _volume: 1.0,
          setVolume: function(vol) { this._volume = vol; },
          getVolume: function() { return this._volume; }
        };

        wrapper.setVolume(1.5);
        return wrapper.getVolume();
      });

      expect(result).toBe(1.5);
    });

    it('should accept fade time parameter', async () => {
      const result = await page.evaluate(() => {
        const wrapper = new window.SoundWrapper(null);

        wrapper.sound = {
          _volume: 1.0,
          _fadeTime: 0,
          setVolume: function(vol, time = 0) {
            this._volume = vol;
            this._fadeTime = time;
          },
          getVolume: function() { return this._volume; }
        };

        wrapper.setVolume(0.3, 1000);
        return {
          volume: wrapper.getVolume(),
          fadeTime: wrapper.sound._fadeTime
        };
      });

      expect(result.volume).toBe(0.3);
      expect(result.fadeTime).toBe(1000);
    });
  });

  describe('Loop Control', () => {
    it('should set loop to true', async () => {
      const result = await page.evaluate(() => {
        const wrapper = new window.SoundWrapper(null);

        wrapper.sound = {
          loop: false
        };

        wrapper.setLoop(true);
        return wrapper.getLoop();
      });

      expect(result).toBe(true);
    });

    it('should set loop to false', async () => {
      const result = await page.evaluate(() => {
        const wrapper = new window.SoundWrapper(null);

        wrapper.sound = {
          loop: true
        };

        wrapper.setLoop(false);
        return wrapper.getLoop();
      });

      expect(result).toBe(false);
    });

    it('should return false for loop when not initialized', async () => {
      const result = await page.evaluate(() => {
        const wrapper = new window.SoundWrapper(null);
        return wrapper.getLoop();
      });

      expect(result).toBe(false);
    });
  });

  describe('Playback Rate', () => {
    it('should set playback rate to normal speed (1.0)', async () => {
      const result = await page.evaluate(() => {
        const wrapper = new window.SoundWrapper(null);

        wrapper.sound = {
          _playbackRate: 1.0,
          setPlaybackRate: function(rate) { this._playbackRate = rate; }
        };

        wrapper.setPlaybackRate(1.0);
        return wrapper.getPlaybackRate();
      });

      expect(result).toBe(1.0);
    });

    it('should set playback rate to 2x speed', async () => {
      const result = await page.evaluate(() => {
        const wrapper = new window.SoundWrapper(null);

        wrapper.sound = {
          _playbackRate: 1.0,
          setPlaybackRate: function(rate) { this._playbackRate = rate; }
        };

        wrapper.setPlaybackRate(2.0);
        return wrapper.getPlaybackRate();
      });

      expect(result).toBe(2.0);
    });

    it('should set playback rate to 0.5x speed (slower)', async () => {
      const result = await page.evaluate(() => {
        const wrapper = new window.SoundWrapper(null);

        wrapper.sound = {
          _playbackRate: 1.0,
          setPlaybackRate: function(rate) { this._playbackRate = rate; }
        };

        wrapper.setPlaybackRate(0.5);
        return wrapper.getPlaybackRate();
      });

      expect(result).toBe(0.5);
    });

    it('should return 1.0 for playback rate when not initialized', async () => {
      const result = await page.evaluate(() => {
        const wrapper = new window.SoundWrapper(null);
        return wrapper.getPlaybackRate();
      });

      expect(result).toBe(1.0);
    });
  });

  describe('Panning Control', () => {
    it('should set panning (center)', async () => {
      const result = await page.evaluate(() => {
        try {
          const wrapper = new window.SoundWrapper(null);

          wrapper.sound = {
            _pan: 0,
            setPanningModel: function(pan) { this._pan = pan; }
          };

          wrapper.setPanning(0);
          return { success: true, pan: wrapper.sound._pan };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.pan).toBe(0);
    });

    it('should set panning (full left)', async () => {
      const result = await page.evaluate(() => {
        const wrapper = new window.SoundWrapper(null);

        wrapper.sound = {
          _pan: 0,
          setPanningModel: function(pan) { this._pan = pan; }
        };

        wrapper.setPanning(-1);
        return wrapper.sound._pan;
      });

      expect(result).toBe(-1);
    });

    it('should set panning (full right)', async () => {
      const result = await page.evaluate(() => {
        const wrapper = new window.SoundWrapper(null);

        wrapper.sound = {
          _pan: 0,
          setPanningModel: function(pan) { this._pan = pan; }
        };

        wrapper.setPanning(1);
        return wrapper.sound._pan;
      });

      expect(result).toBe(1);
    });
  });

  describe('Duration and Time', () => {
    it('should return duration from sound object', async () => {
      const result = await page.evaluate(() => {
        const wrapper = new window.SoundWrapper(null);

        wrapper.sound = {
          _duration: 5.5 // 5.5 seconds
        };

        return wrapper.getDuration();
      });

      expect(result).toBe(5.5);
    });

    it('should return current time from sound object', async () => {
      const result = await page.evaluate(() => {
        const wrapper = new window.SoundWrapper(null);

        wrapper.sound = {
          currentTime: 2.3 // 2.3 seconds into playback
        };

        return wrapper.getCurrentTime();
      });

      expect(result).toBe(2.3);
    });
  });

  describe('Multiple Configuration Changes', () => {
    it('should handle multiple configuration changes in sequence', async () => {
      const result = await page.evaluate(() => {
        const wrapper = new window.SoundWrapper(null);

        // Mock complete sound object
        wrapper.sound = {
          _volume: 1.0,
          _playbackRate: 1.0,
          loop: false,
          _pan: 0,
          setVolume: function(vol) { this._volume = vol; },
          getVolume: function() { return this._volume; },
          setPlaybackRate: function(rate) { this._playbackRate = rate; },
          setPanningModel: function(pan) { this._pan = pan; }
        };

        // Change multiple settings
        wrapper.setVolume(0.7);
        wrapper.setPlaybackRate(1.5);
        wrapper.setLoop(true);
        wrapper.setPanning(-0.5);

        return {
          volume: wrapper.getVolume(),
          playbackRate: wrapper.getPlaybackRate(),
          loop: wrapper.getLoop(),
          pan: wrapper.sound._pan
        };
      });

      expect(result.volume).toBe(0.7);
      expect(result.playbackRate).toBe(1.5);
      expect(result.loop).toBe(true);
      expect(result.pan).toBe(-0.5);
    });
  });
});

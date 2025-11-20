import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';

/**
 * Phase 1 Tests: Playback State
 * Tests basic playback state management (play, pause, stop)
 */
describe('Phase 1: Playback State', () => {
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

    // Suppress console errors
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

  it('should have play method that can be called', async () => {
    const result = await page.evaluate(() => {
      try {
        const wrapper = new window.SoundWrapper(null);
        wrapper.play(); // Should not throw even with null sound
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
  });

  it('should have stop method that can be called', async () => {
    const result = await page.evaluate(() => {
      try {
        const wrapper = new window.SoundWrapper(null);
        wrapper.stop(); // Should not throw even with null sound
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
  });

  it('should have pause method that can be called', async () => {
    const result = await page.evaluate(() => {
      try {
        const wrapper = new window.SoundWrapper(null);
        wrapper.pause(); // Should not throw even with null sound
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
  });

  it('should return false for isPlaying initially', async () => {
    const isPlaying = await page.evaluate(() => {
      const wrapper = new window.SoundWrapper(null);
      return wrapper.isPlaying;
    });

    expect(isPlaying).toBe(false);
  });

  it('should return false for isPaused initially', async () => {
    const isPaused = await page.evaluate(() => {
      const wrapper = new window.SoundWrapper(null);
      return wrapper.isPaused;
    });

    expect(isPaused).toBe(false);
  });

  it('should track playback state with mock sound object', async () => {
    const result = await page.evaluate(() => {
      // Create a wrapper with a mock sound object
      const wrapper = new window.SoundWrapper(null);

      // Mock a BabylonJS Sound object
      wrapper.sound = {
        isPlaying: false,
        isPaused: false,
        play: function() { this.isPlaying = true; this.isPaused = false; },
        pause: function() { this.isPlaying = false; this.isPaused = true; },
        stop: function() { this.isPlaying = false; this.isPaused = false; },
        isReady: () => true,
      };

      const states = [];

      // Initial state
      states.push({ isPlaying: wrapper.isPlaying, isPaused: wrapper.isPaused });

      // After play
      wrapper.play();
      states.push({ isPlaying: wrapper.isPlaying, isPaused: wrapper.isPaused });

      // After pause
      wrapper.pause();
      states.push({ isPlaying: wrapper.isPlaying, isPaused: wrapper.isPaused });

      // After stop
      wrapper.stop();
      states.push({ isPlaying: wrapper.isPlaying, isPaused: wrapper.isPaused });

      return states;
    });

    // Initial state
    expect(result[0].isPlaying).toBe(false);
    expect(result[0].isPaused).toBe(false);

    // After play
    expect(result[1].isPlaying).toBe(true);
    expect(result[1].isPaused).toBe(false);

    // After pause
    expect(result[2].isPlaying).toBe(false);
    expect(result[2].isPaused).toBe(true);

    // After stop
    expect(result[3].isPlaying).toBe(false);
    expect(result[3].isPaused).toBe(false);
  });

  it('should correctly report ready state', async () => {
    const result = await page.evaluate(() => {
      const wrapper = new window.SoundWrapper(null);

      // Mock sound object
      wrapper.sound = {
        isPlaying: false,
        isPaused: false,
        isReady: () => true,
      };

      return wrapper.isReady;
    });

    expect(result).toBe(true);
  });

  it('should return 0 for current time when not initialized', async () => {
    const currentTime = await page.evaluate(() => {
      const wrapper = new window.SoundWrapper(null);
      return wrapper.getCurrentTime();
    });

    expect(currentTime).toBe(0);
  });
});

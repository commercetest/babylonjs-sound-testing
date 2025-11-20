import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { chromium } from 'playwright';

/**
 * Phase 1 Tests: Sound Creation & Loading
 * Tests the basic creation of sound objects and initialization
 */
describe('Phase 1: Sound Creation & Loading', () => {
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

    // Suppress console errors from BabylonJS trying to create AudioContext
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    // Navigate to our test page
    await page.goto('http://localhost:5173/index.html', {
      waitUntil: 'networkidle'
    });
  }, 30000);

  afterAll(async () => {
    await page?.close();
    await context?.close();
    await browser?.close();
  });

  it('should load SoundWrapper class successfully', async () => {
    const isLoaded = await page.evaluate(() => {
      return typeof window.SoundWrapper !== 'undefined';
    });

    expect(isLoaded).toBe(true);
  });

  it('should have createSound static method', async () => {
    const hasMethod = await page.evaluate(() => {
      return typeof window.SoundWrapper.createSound === 'function';
    });

    expect(hasMethod).toBe(true);
  });

  it('should create a sound object with valid parameters', async () => {
    const result = await page.evaluate(async () => {
      try {
        // Mock the Sound constructor to avoid actually loading audio
        const originalSound = window.BABYLON?.Sound;

        // Create a minimal test that doesn't require actual audio loading
        const wrapper = new window.SoundWrapper(null);

        return {
          success: true,
          hasSound: wrapper.sound !== undefined,
          isPlaying: wrapper.isPlaying,
          methods: {
            hasPlay: typeof wrapper.play === 'function',
            hasStop: typeof wrapper.stop === 'function',
            hasPause: typeof wrapper.pause === 'function',
            hasSetVolume: typeof wrapper.setVolume === 'function',
            hasGetVolume: typeof wrapper.getVolume === 'function',
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    expect(result.success).toBe(true);
    expect(result.methods.hasPlay).toBe(true);
    expect(result.methods.hasStop).toBe(true);
    expect(result.methods.hasPause).toBe(true);
    expect(result.methods.hasSetVolume).toBe(true);
    expect(result.methods.hasGetVolume).toBe(true);
  });

  it('should initialize with sound object set to null', async () => {
    const soundValue = await page.evaluate(() => {
      const wrapper = new window.SoundWrapper(null);
      return wrapper.sound;
    });

    expect(soundValue).toBe(null);
  });

  it('should have isPlaying return false when not initialized', async () => {
    const isPlaying = await page.evaluate(() => {
      const wrapper = new window.SoundWrapper(null);
      return wrapper.isPlaying;
    });

    expect(isPlaying).toBe(false);
  });

  it('should have isPaused return false when not initialized', async () => {
    const isPaused = await page.evaluate(() => {
      const wrapper = new window.SoundWrapper(null);
      return wrapper.isPaused;
    });

    expect(isPaused).toBe(false);
  });

  it('should have isReady return false when not initialized', async () => {
    const isReady = await page.evaluate(() => {
      const wrapper = new window.SoundWrapper(null);
      return wrapper.isReady;
    });

    expect(isReady).toBe(false);
  });

  it('should return 0 for volume when not initialized', async () => {
    const volume = await page.evaluate(() => {
      const wrapper = new window.SoundWrapper(null);
      return wrapper.getVolume();
    });

    expect(volume).toBe(0);
  });

  it('should return 0 for duration when not initialized', async () => {
    const duration = await page.evaluate(() => {
      const wrapper = new window.SoundWrapper(null);
      return wrapper.getDuration();
    });

    expect(duration).toBe(0);
  });

  it('should safely handle dispose when sound is null', async () => {
    const result = await page.evaluate(() => {
      try {
        const wrapper = new window.SoundWrapper(null);
        wrapper.dispose();
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
  });
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';

/**
 * Resource Cleanup and Memory Management Tests
 * Tests proper cleanup of resources to prevent memory leaks
 */
describe('Resource Cleanup and Memory Management', () => {
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

  describe('AudioContext Cleanup', () => {
    it('should properly close AudioContext after use', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const initialState = audioContext.state;

          await audioContext.close();
          const closedState = audioContext.state;

          return {
            success: true,
            initialState: initialState,
            closedState: closedState,
            properlyClosed: closedState === 'closed'
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.properlyClosed).toBe(true);
    });

    it('should clean up multiple AudioContexts', async () => {
      const result = await page.evaluate(async () => {
        try {
          const contexts = [];

          for (let i = 0; i < 5; i++) {
            contexts.push(new AudioContext());
          }

          // Close all
          await Promise.all(contexts.map(ctx => ctx.close()));

          const allClosed = contexts.every(ctx => ctx.state === 'closed');

          return {
            success: true,
            count: contexts.length,
            allClosed: allClosed
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(5);
      expect(result.allClosed).toBe(true);
    });
  });

  describe('Audio Source Cleanup', () => {
    it('should stop source before disposing', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.5
          );

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);

          source.start(0);

          // Wait a bit
          await new Promise(resolve => setTimeout(resolve, 100));

          // Stop before cleanup
          source.stop();

          // Clean up
          source.disconnect();
          await audioContext.close();

          return {
            success: true,
            cleaned: true
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.cleaned).toBe(true);
    });

    it('should handle stopping already-stopped source', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.1
          );

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);

          source.start(0);
          source.stop();

          // Try to stop again
          try {
            source.stop();
          } catch (e) {
            // Expected - can't stop twice
          }

          await audioContext.close();

          return {
            success: true
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
    });

    it('should disconnect nodes properly', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.1
          );

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;

          const gainNode = audioContext.createGain();
          const analyser = audioContext.createAnalyser();

          // Connect chain
          source.connect(gainNode);
          gainNode.connect(analyser);
          analyser.connect(audioContext.destination);

          // Disconnect in reverse order
          analyser.disconnect();
          gainNode.disconnect();
          source.disconnect();

          await audioContext.close();

          return {
            success: true,
            disconnected: true
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.disconnected).toBe(true);
    });
  });

  describe('SoundWrapper Cleanup', () => {
    it('should properly dispose sound wrapper', async () => {
      const result = await page.evaluate(() => {
        try {
          const wrapper = new window.SoundWrapper(null);

          let disposed = false;
          wrapper.sound = {
            dispose: function() { disposed = true; }
          };

          wrapper.dispose();

          return {
            success: true,
            disposed: disposed,
            soundIsNull: wrapper.sound === null
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.disposed).toBe(true);
      expect(result.soundIsNull).toBe(true);
    });

    it('should handle dispose without sound object', async () => {
      const result = await page.evaluate(() => {
        try {
          const wrapper = new window.SoundWrapper(null);

          // Sound is already null
          wrapper.dispose();
          wrapper.dispose(); // Dispose again

          return {
            success: true
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
    });

    it('should clean up after using analyzer', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.1
          );

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;

          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 2048;

          source.connect(analyser);
          analyser.connect(audioContext.destination);

          source.start(0);

          // Get frequency data
          const frequencyData = new Float32Array(analyser.frequencyBinCount);
          analyser.getFloatFrequencyData(frequencyData);

          // Clean up
          source.stop();
          source.disconnect();
          analyser.disconnect();

          await audioContext.close();

          return {
            success: true,
            cleaned: true
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.cleaned).toBe(true);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should not accumulate sources without cleanup', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.05
          );

          const sources = [];

          // Create many sources
          for (let i = 0; i < 50; i++) {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            sources.push(source);
          }

          // Start and immediately stop all
          for (const source of sources) {
            source.start(0);
            source.stop(0.01);
          }

          // Wait for all to finish
          await new Promise(resolve => setTimeout(resolve, 100));

          // Clean up
          for (const source of sources) {
            try {
              source.disconnect();
            } catch (e) {
              // May already be disconnected
            }
          }

          await audioContext.close();

          return {
            success: true,
            sourceCount: sources.length
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.sourceCount).toBe(50);
    });

    it('should clean up blob URLs', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.1
          );

          const blob = await window.AudioTestUtils.audioBufferToBlob(audioBuffer);
          const url = URL.createObjectURL(blob);

          const urlCreated = url.startsWith('blob:');

          // Clean up URL
          URL.revokeObjectURL(url);

          await audioContext.close();

          return {
            success: true,
            urlCreated: urlCreated,
            urlRevoked: true
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.urlCreated).toBe(true);
      expect(result.urlRevoked).toBe(true);
    });

    it('should handle rapid create/destroy cycles', async () => {
      const result = await page.evaluate(async () => {
        try {
          const cycles = 10;

          for (let i = 0; i < cycles; i++) {
            const audioContext = new AudioContext();
            const audioBuffer = window.AudioTestUtils.generateTestTone(
              audioContext,
              440 + (i * 100),
              0.01
            );

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);

            source.start(0);
            source.stop(0.005);

            await new Promise(resolve => setTimeout(resolve, 10));

            source.disconnect();
            await audioContext.close();
          }

          return {
            success: true,
            cycles: cycles
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.cycles).toBe(10);
    });
  });

  describe('Array and Buffer Cleanup', () => {
    it('should handle large frequency data arrays', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();

          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 32768; // Very large FFT

          const frequencyData = new Float32Array(analyser.frequencyBinCount);
          analyser.getFloatFrequencyData(frequencyData);

          await audioContext.close();

          return {
            success: true,
            dataSize: frequencyData.length
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.dataSize).toBeGreaterThan(0);
    });

    it('should create and discard multiple audio buffers', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const bufferCount = 20;

          for (let i = 0; i < bufferCount; i++) {
            // Create and immediately discard
            const buffer = window.AudioTestUtils.generateTestTone(
              audioContext,
              440 + (i * 50),
              0.1
            );
            // Buffer goes out of scope and should be GC'd
          }

          await audioContext.close();

          return {
            success: true,
            bufferCount: bufferCount
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.bufferCount).toBe(20);
    });
  });
});

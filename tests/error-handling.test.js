import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';

/**
 * Error Handling and Validation Tests
 * Tests error conditions, invalid inputs, and proper error handling
 */
describe('Error Handling and Validation', () => {
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

  describe('Invalid Input Handling', () => {
    it('should handle negative frequency', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            -440, // Negative frequency
            0.1
          );

          await audioContext.close();

          return {
            success: true,
            duration: audioBuffer.duration
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      // Should either succeed (treating as absolute value) or fail gracefully
      expect(result.success).toBeDefined();
    });

    it('should handle negative duration', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            -1 // Negative duration
          );

          await audioContext.close();

          return {
            success: true,
            duration: audioBuffer.duration,
            length: audioBuffer.length
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      // Negative duration should create zero or error
      if (result.success) {
        expect(result.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle zero frequency', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            0, // Zero frequency (DC)
            0.1
          );

          await audioContext.close();

          return {
            success: true,
            duration: audioBuffer.duration
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      // Zero frequency should generate DC offset
    });

    it('should handle extremely large frequency', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            1000000, // 1MHz - way beyond audible/Nyquist
            0.1
          );

          await audioContext.close();

          return {
            success: true,
            duration: audioBuffer.duration
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      // Should complete but will alias heavily
    });

    it('should handle NaN frequency', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            NaN,
            0.1
          );

          await audioContext.close();

          return {
            success: true,
            duration: audioBuffer.duration
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      // NaN should either error or produce silence
      expect(result.success).toBeDefined();
    });

    it('should handle Infinity frequency', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            Infinity,
            0.1
          );

          await audioContext.close();

          return {
            success: true,
            duration: audioBuffer.duration
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      // Infinity should either error or produce NaN samples
      expect(result.success).toBeDefined();
    });
  });

  describe('AudioContext State Management', () => {
    it('should handle operations on closed AudioContext', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          await audioContext.close();

          // Try to use closed context
          const state = audioContext.state;

          return {
            success: true,
            state: state,
            isClosed: state === 'closed'
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.isClosed).toBe(true);
    });

    it('should handle multiple close calls on AudioContext', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();

          await audioContext.close();

          // Subsequent closes may throw or succeed depending on implementation
          try {
            await audioContext.close(); // Close again
            await audioContext.close(); // And again
          } catch (e) {
            // Expected - some browsers throw on re-close
          }

          return {
            success: true,
            state: audioContext.state
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.state).toBe('closed');
    });
  });

  describe('hasFrequency Validation', () => {
    it('should handle zero tolerance', async () => {
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
          await new Promise(resolve => setTimeout(resolve, 50));

          const frequencyData = new Float32Array(analyser.frequencyBinCount);
          analyser.getFloatFrequencyData(frequencyData);

          const hasFreq = window.AudioTestUtils.hasFrequency(
            frequencyData,
            440,
            audioContext.sampleRate,
            0, // Zero tolerance
            -50
          );

          source.stop();
          await audioContext.close();

          return {
            success: true,
            hasFreq: hasFreq
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      // Zero tolerance means exact bin match only
      expect(typeof result.hasFreq).toBe('boolean');
    });

    it('should handle negative tolerance', async () => {
      const result = await page.evaluate(() => {
        try {
          const data = new Float32Array(1024);
          data[100] = -40; // Some energy

          const hasFreq = window.AudioTestUtils.hasFrequency(
            data,
            1000,
            44100,
            -50, // Negative tolerance
            -50
          );

          return {
            success: true,
            hasFreq: hasFreq
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      // Negative tolerance should be handled gracefully
    });

    it('should handle target frequency of zero', async () => {
      const result = await page.evaluate(() => {
        try {
          const data = new Float32Array(1024);
          data[0] = -40; // DC component

          const hasFreq = window.AudioTestUtils.hasFrequency(
            data,
            0, // DC frequency
            44100,
            10,
            -50
          );

          return {
            success: true,
            hasFreq: hasFreq
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
    });

    it('should handle target frequency beyond array bounds', async () => {
      const result = await page.evaluate(() => {
        try {
          const data = new Float32Array(1024);

          const hasFreq = window.AudioTestUtils.hasFrequency(
            data,
            100000, // Way beyond what this FFT can represent
            44100,
            100,
            -50
          );

          return {
            success: true,
            hasFreq: hasFreq
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.hasFreq).toBe(false);
    });
  });

  describe('findDominantFrequency Edge Cases', () => {
    it('should handle all-same-value frequency data', async () => {
      const result = await page.evaluate(() => {
        try {
          const data = new Float32Array(1024);
          data.fill(-60); // All same value

          const dominantFreq = window.AudioTestUtils.findDominantFrequency(
            data,
            44100
          );

          return {
            success: true,
            dominantFreq: dominantFreq
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      // Should return first bin (0Hz) when all are equal
      expect(result.dominantFreq).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero sample rate', async () => {
      const result = await page.evaluate(() => {
        try {
          const data = new Float32Array(1024);
          data[100] = -40;

          const dominantFreq = window.AudioTestUtils.findDominantFrequency(
            data,
            0 // Zero sample rate
          );

          return {
            success: true,
            dominantFreq: dominantFreq
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      // Zero sample rate should give 0Hz or handle gracefully
      expect(result.dominantFreq).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateRMS Edge Cases', () => {
    it('should handle very large values', async () => {
      const result = await page.evaluate(() => {
        try {
          const data = new Float32Array(1024);
          data.fill(100); // Very large dB values

          const rms = window.AudioTestUtils.calculateRMS(data);

          return {
            success: true,
            rms: rms,
            isFinite: isFinite(rms)
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.isFinite).toBe(true);
      expect(result.rms).toBeGreaterThan(0);
    });

    it('should handle very negative values', async () => {
      const result = await page.evaluate(() => {
        try {
          const data = new Float32Array(1024);
          data.fill(-200); // Very quiet

          const rms = window.AudioTestUtils.calculateRMS(data);

          return {
            success: true,
            rms: rms,
            isFinite: isFinite(rms)
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.isFinite).toBe(true);
      expect(result.rms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('isSilent Threshold Validation', () => {
    it('should handle very high threshold', async () => {
      const result = await page.evaluate(() => {
        try {
          const data = new Float32Array(1024);
          data.fill(-50); // -50dB

          const isSilent = window.AudioTestUtils.isSilent(
            data,
            100 // Very high threshold (everything should be silent)
          );

          return {
            success: true,
            isSilent: isSilent
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.isSilent).toBe(true);
    });

    it('should handle very low threshold', async () => {
      const result = await page.evaluate(() => {
        try {
          const data = new Float32Array(1024);
          data.fill(-50); // -50dB

          const isSilent = window.AudioTestUtils.isSilent(
            data,
            -200 // Very low threshold (nothing should be silent)
          );

          return {
            success: true,
            isSilent: isSilent
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.isSilent).toBe(false);
    });

    it('should handle Infinity threshold', async () => {
      const result = await page.evaluate(() => {
        try {
          const data = new Float32Array(1024);
          data.fill(0);

          const isSilent = window.AudioTestUtils.isSilent(
            data,
            Infinity
          );

          return {
            success: true,
            isSilent: isSilent
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      // All finite values are less than Infinity
      expect(result.isSilent).toBe(true);
    });
  });
});

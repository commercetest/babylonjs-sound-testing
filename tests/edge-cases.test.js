import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';

/**
 * Edge Cases and Boundary Condition Tests
 * Tests unusual inputs, boundary values, and edge cases to find implementation flaws
 */
describe('Edge Cases and Boundary Conditions', () => {
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

  describe('Audio Generation Edge Cases', () => {
    it('should handle zero duration audio', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();

          // Create a zero-duration buffer directly
          const audioBuffer = audioContext.createBuffer(1, 0, audioContext.sampleRate);

          // Try to convert to blob
          const blob = await window.AudioTestUtils.audioBufferToBlob(audioBuffer);

          await audioContext.close();

          return {
            success: true,
            duration: audioBuffer.duration,
            length: audioBuffer.length,
            blobSize: blob.size
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      // Zero-length buffers might not be supported in all browsers
      if (result.success) {
        expect(result.duration).toBe(0);
        expect(result.length).toBe(0);
        expect(result.blobSize).toBe(44); // Just the WAV header
      } else {
        // It's okay if zero-length buffers throw errors
        expect(result.error).toBeDefined();
      }
    });

    it('should handle very short duration (1ms)', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.001 // 1ms
          );

          await audioContext.close();

          return {
            success: true,
            duration: audioBuffer.duration,
            length: audioBuffer.length,
            hasData: audioBuffer.length > 0
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.hasData).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle very long duration (10 seconds)', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const duration = 10.0; // 10 seconds
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            duration
          );

          await audioContext.close();

          return {
            success: true,
            duration: audioBuffer.duration,
            expectedSamples: duration * audioContext.sampleRate,
            actualSamples: audioBuffer.length
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.duration).toBeCloseTo(10.0, 1);
      // Sample count should be approximately correct (allow some variance for different sample rates)
      const sampleTolerance = result.expectedSamples * 0.1; // 10% tolerance
      expect(Math.abs(result.actualSamples - result.expectedSamples)).toBeLessThan(sampleTolerance);
    });

    it('should handle very low frequency (20Hz - human hearing limit)', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const lowFreq = 20; // 20Hz - human hearing lower limit
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            lowFreq,
            0.5
          );

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;

          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 8192; // Larger FFT for low frequencies

          source.connect(analyser);
          analyser.connect(audioContext.destination);

          source.start(0);
          await new Promise(resolve => setTimeout(resolve, 100));

          const frequencyData = new Float32Array(analyser.frequencyBinCount);
          analyser.getFloatFrequencyData(frequencyData);

          const hasLowFreq = window.AudioTestUtils.hasFrequency(
            frequencyData,
            lowFreq,
            audioContext.sampleRate,
            20, // Wider tolerance for low frequencies
            -60
          );

          source.stop();
          await audioContext.close();

          return {
            success: true,
            frequency: lowFreq,
            detected: hasLowFreq
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      // Low frequencies can be detected
      expect(typeof result.detected).toBe('boolean');
    });

    it('should handle very high frequency (20kHz - human hearing limit)', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const highFreq = 20000; // 20kHz - human hearing upper limit
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            highFreq,
            0.1
          );

          await audioContext.close();

          return {
            success: true,
            frequency: highFreq,
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.frequency).toBe(20000);
    });

    it('should handle frequency at Nyquist limit (half sample rate)', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const nyquistFreq = audioContext.sampleRate / 2; // Nyquist frequency

          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            nyquistFreq,
            0.1
          );

          await audioContext.close();

          return {
            success: true,
            sampleRate: audioContext.sampleRate,
            nyquistFreq: nyquistFreq,
            duration: audioBuffer.duration
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.nyquistFreq).toBe(result.sampleRate / 2);
    });

    it('should handle frequency beyond Nyquist limit (aliasing)', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const beyondNyquist = audioContext.sampleRate; // Above Nyquist

          // This should still generate, but will alias
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            beyondNyquist,
            0.1
          );

          await audioContext.close();

          return {
            success: true,
            requestedFreq: beyondNyquist,
            duration: audioBuffer.duration,
            sampleRate: audioContext.sampleRate
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      // Should complete without error (though will alias)
    });
  });

  describe('Frequency Analysis Edge Cases', () => {
    it('should handle all-zero frequency data', async () => {
      const result = await page.evaluate(() => {
        try {
          const zeroData = new Float32Array(1024);
          zeroData.fill(0);

          const isSilent = window.AudioTestUtils.isSilent(zeroData, -100);
          const rms = window.AudioTestUtils.calculateRMS(zeroData);
          const dominantFreq = window.AudioTestUtils.findDominantFrequency(zeroData, 44100);

          return {
            success: true,
            isSilent: isSilent,
            rms: rms,
            dominantFreq: dominantFreq
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.isSilent).toBe(false); // Zero is not below threshold
      expect(result.rms).toBeGreaterThanOrEqual(0);
      expect(result.dominantFreq).toBeGreaterThanOrEqual(0);
    });

    it('should handle all-negative-infinity frequency data', async () => {
      const result = await page.evaluate(() => {
        try {
          const data = new Float32Array(1024);
          data.fill(-Infinity);

          const isSilent = window.AudioTestUtils.isSilent(data, -100);
          const rms = window.AudioTestUtils.calculateRMS(data);

          return {
            success: true,
            isSilent: isSilent,
            rms: rms,
            rmsIsFinite: isFinite(rms)
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.isSilent).toBe(true); // All -Infinity is silent
      expect(result.rmsIsFinite).toBe(true);
      expect(result.rms).toBe(0);
    });

    it('should handle mixed finite and infinite values', async () => {
      const result = await page.evaluate(() => {
        try {
          const data = new Float32Array(1024);
          data.fill(-Infinity);
          // Add some finite values
          for (let i = 0; i < 10; i++) {
            data[i] = -50; // -50dB
          }

          const rms = window.AudioTestUtils.calculateRMS(data);
          const isSilent = window.AudioTestUtils.isSilent(data, -100);

          return {
            success: true,
            rms: rms,
            rmsIsFinite: isFinite(rms),
            isSilent: isSilent
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.rmsIsFinite).toBe(true);
      expect(result.rms).toBeGreaterThan(0);
      expect(result.isSilent).toBe(false);
    });

    it('should handle empty frequency data array', async () => {
      const result = await page.evaluate(() => {
        try {
          const emptyData = new Float32Array(0);

          const isSilent = window.AudioTestUtils.isSilent(emptyData, -100);
          const rms = window.AudioTestUtils.calculateRMS(emptyData);

          return {
            success: true,
            isSilent: isSilent,
            rms: rms
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.isSilent).toBe(true); // Empty is silent
      expect(result.rms).toBe(0);
    });

    it('should handle single element frequency data', async () => {
      const result = await page.evaluate(() => {
        try {
          const singleData = new Float32Array(1);
          singleData[0] = -50; // -50dB

          const isSilent = window.AudioTestUtils.isSilent(singleData, -100);
          const rms = window.AudioTestUtils.calculateRMS(singleData);
          const dominantFreq = window.AudioTestUtils.findDominantFrequency(singleData, 44100);

          return {
            success: true,
            isSilent: isSilent,
            rms: rms,
            dominantFreq: dominantFreq
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.rms).toBeGreaterThanOrEqual(0);
      expect(result.dominantFreq).toBeGreaterThanOrEqual(0);
    });
  });

  describe('SoundWrapper Edge Cases', () => {
    it('should safely handle all methods when sound is null', async () => {
      const result = await page.evaluate(() => {
        try {
          const wrapper = new window.SoundWrapper(null);

          // Try all methods
          wrapper.play();
          wrapper.stop();
          wrapper.pause();
          wrapper.setVolume(0.5);
          wrapper.setPlaybackRate(1.5);
          wrapper.setLoop(true);
          wrapper.setPanning(0.5);
          wrapper.dispose();

          const attachResult = wrapper.attachAnalyzer();
          const analyzer = wrapper.getAnalyzer();
          const freqData = wrapper.getFrequencyData();
          const byteData = wrapper.getByteFrequencyData();

          return {
            success: true,
            attachResult: attachResult,
            analyzer: analyzer,
            freqData: freqData,
            byteData: byteData,
            isPlaying: wrapper.isPlaying,
            isPaused: wrapper.isPaused,
            isReady: wrapper.isReady,
            volume: wrapper.getVolume(),
            playbackRate: wrapper.getPlaybackRate(),
            loop: wrapper.getLoop(),
            duration: wrapper.getDuration(),
            currentTime: wrapper.getCurrentTime(),
            sampleRate: wrapper.getSampleRate()
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.attachResult).toBe(false);
      expect(result.analyzer).toBe(null);
      expect(result.freqData).toBe(null);
      expect(result.byteData).toBe(null);
      expect(result.isPlaying).toBe(false);
      expect(result.isPaused).toBe(false);
      expect(result.isReady).toBe(false);
      expect(result.volume).toBe(0);
      expect(result.playbackRate).toBe(1.0);
      expect(result.loop).toBe(false);
      expect(result.duration).toBe(0);
      expect(result.currentTime).toBe(0);
      expect(result.sampleRate).toBe(44100);
    });

    it('should handle dispose called multiple times', async () => {
      const result = await page.evaluate(() => {
        try {
          const wrapper = new window.SoundWrapper(null);

          // Mock sound object
          let disposeCount = 0;
          wrapper.sound = {
            dispose: function() { disposeCount++; }
          };

          // Dispose multiple times
          wrapper.dispose();
          wrapper.dispose();
          wrapper.dispose();

          return {
            success: true,
            disposeCount: disposeCount,
            soundIsNull: wrapper.sound === null
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.disposeCount).toBe(1); // Should only dispose once
      expect(result.soundIsNull).toBe(true);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple audio contexts created simultaneously', async () => {
      const result = await page.evaluate(async () => {
        try {
          const contexts = [];
          const contextCount = 5;

          // Create multiple contexts
          for (let i = 0; i < contextCount; i++) {
            contexts.push(new AudioContext());
          }

          // Verify all created successfully
          const states = contexts.map(ctx => ctx.state);

          // Close all
          await Promise.all(contexts.map(ctx => ctx.close()));

          return {
            success: true,
            contextCount: contexts.length,
            states: states
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.contextCount).toBe(5);
      result.states.forEach(state => {
        expect(['running', 'suspended', 'closed']).toContain(state);
      });
    });

    it('should handle rapid audio generation', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const buffers = [];

          // Generate 10 tones rapidly
          for (let i = 0; i < 10; i++) {
            const buffer = window.AudioTestUtils.generateTestTone(
              audioContext,
              440 + (i * 100),
              0.1
            );
            buffers.push(buffer);
          }

          await audioContext.close();

          return {
            success: true,
            bufferCount: buffers.length,
            allValid: buffers.every(b => b.duration > 0)
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.bufferCount).toBe(10);
      expect(result.allValid).toBe(true);
    });
  });
});

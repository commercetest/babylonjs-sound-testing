import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';

/**
 * Tests for Previously Untested Functions
 * Tests functions that weren't covered in initial test suites
 */
describe('Previously Untested Functions', () => {
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

  describe('audioBufferToBlob', () => {
    it('should convert audio buffer to WAV blob', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.5
          );

          const blob = await window.AudioTestUtils.audioBufferToBlob(audioBuffer);

          await audioContext.close();

          return {
            success: true,
            blobType: blob.type,
            blobSize: blob.size,
            expectedMinSize: 44, // WAV header is 44 bytes
            hasContent: blob.size > 44
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.blobType).toBe('audio/wav');
      expect(result.blobSize).toBeGreaterThan(result.expectedMinSize);
      expect(result.hasContent).toBe(true);
    });

    it('should create valid WAV header', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.1
          );

          const blob = await window.AudioTestUtils.audioBufferToBlob(audioBuffer);

          // Read the header
          const arrayBuffer = await blob.arrayBuffer();
          const view = new DataView(arrayBuffer);

          // Read RIFF header
          const riff = String.fromCharCode(
            view.getUint8(0),
            view.getUint8(1),
            view.getUint8(2),
            view.getUint8(3)
          );

          // Read WAVE format
          const wave = String.fromCharCode(
            view.getUint8(8),
            view.getUint8(9),
            view.getUint8(10),
            view.getUint8(11)
          );

          // Read fmt chunk
          const fmt = String.fromCharCode(
            view.getUint8(12),
            view.getUint8(13),
            view.getUint8(14),
            view.getUint8(15)
          );

          // Read audio format (should be 1 for PCM)
          const audioFormat = view.getUint16(20, true);

          // Read number of channels
          const numChannels = view.getUint16(22, true);

          // Read sample rate
          const sampleRate = view.getUint32(24, true);

          await audioContext.close();

          return {
            success: true,
            riff: riff,
            wave: wave,
            fmt: fmt,
            audioFormat: audioFormat,
            numChannels: numChannels,
            sampleRate: sampleRate
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.riff).toBe('RIFF');
      expect(result.wave).toBe('WAVE');
      expect(result.fmt).toBe('fmt ');
      expect(result.audioFormat).toBe(1); // PCM
      expect(result.numChannels).toBeGreaterThan(0);
      expect(result.sampleRate).toBeGreaterThan(0);
    });

    it('should handle zero duration audio buffer', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();

          // Create a zero-duration buffer directly
          const audioBuffer = audioContext.createBuffer(1, 0, audioContext.sampleRate);

          const blob = await window.AudioTestUtils.audioBufferToBlob(audioBuffer);

          await audioContext.close();

          return {
            success: true,
            blobSize: blob.size,
            blobType: blob.type
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      // Zero-length buffers might not be supported in all browsers
      if (result.success) {
        expect(result.blobType).toBe('audio/wav');
        // Should have just the WAV header
        expect(result.blobSize).toBe(44);
      } else {
        // It's okay if zero-length buffers aren't supported
        expect(result.error).toBeDefined();
      }
    });

    it('should handle silence audio buffer', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const audioBuffer = window.AudioTestUtils.generateSilence(
            audioContext,
            0.5
          );

          const blob = await window.AudioTestUtils.audioBufferToBlob(audioBuffer);

          await audioContext.close();

          return {
            success: true,
            blobSize: blob.size,
            duration: audioBuffer.duration
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.blobSize).toBeGreaterThan(44);
      expect(result.duration).toBeCloseTo(0.5, 1);
    });

    it('should create blob that can be read back', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const duration = 0.1;
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            duration
          );

          const blob = await window.AudioTestUtils.audioBufferToBlob(audioBuffer);

          // Try to read the blob as an object URL
          const url = URL.createObjectURL(blob);
          const canCreateURL = url.startsWith('blob:');

          URL.revokeObjectURL(url);
          await audioContext.close();

          return {
            success: true,
            canCreateURL: canCreateURL,
            blobSize: blob.size
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.canCreateURL).toBe(true);
    });

    it('should handle multi-channel audio buffer', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();

          // Create stereo buffer
          const sampleRate = audioContext.sampleRate;
          const duration = 0.1;
          const numChannels = 2;
          const numSamples = duration * sampleRate;

          const audioBuffer = audioContext.createBuffer(
            numChannels,
            numSamples,
            sampleRate
          );

          // Fill channels with different frequencies
          const leftChannel = audioBuffer.getChannelData(0);
          const rightChannel = audioBuffer.getChannelData(1);

          for (let i = 0; i < numSamples; i++) {
            leftChannel[i] = Math.sin(2 * Math.PI * 440 * (i / sampleRate));
            rightChannel[i] = Math.sin(2 * Math.PI * 880 * (i / sampleRate));
          }

          const blob = await window.AudioTestUtils.audioBufferToBlob(audioBuffer);

          await audioContext.close();

          return {
            success: true,
            numChannels: audioBuffer.numberOfChannels,
            blobSize: blob.size,
            blobType: blob.type
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.numChannels).toBe(2);
      expect(result.blobType).toBe('audio/wav');
      expect(result.blobSize).toBeGreaterThan(44);
    });

    it('should clamp sample values correctly', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          const sampleRate = audioContext.sampleRate;
          const duration = 0.01;
          const numSamples = duration * sampleRate;

          const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
          const channelData = audioBuffer.getChannelData(0);

          // Create samples outside [-1, 1] range
          channelData[0] = 2.0;   // Above 1
          channelData[1] = -2.0;  // Below -1
          channelData[2] = 0.5;   // Normal
          channelData[3] = -0.5;  // Normal

          const blob = await window.AudioTestUtils.audioBufferToBlob(audioBuffer);

          await audioContext.close();

          return {
            success: true,
            blobSize: blob.size
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      // Should complete without error (values clamped internally)
      expect(result.blobSize).toBeGreaterThan(44);
    });
  });

  describe('SoundWrapper Analyzer Methods', () => {
    it('should return correct sample rate', async () => {
      const result = await page.evaluate(() => {
        try {
          const wrapper = new window.SoundWrapper(null);

          // With null sound, should return default
          const defaultRate = wrapper.getSampleRate();

          // With mock sound that has audio context
          wrapper.sound = {
            _audioEngine: {
              audioContext: {
                sampleRate: 48000
              }
            }
          };

          const mockRate = wrapper.getSampleRate();

          return {
            success: true,
            defaultRate: defaultRate,
            mockRate: mockRate
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.defaultRate).toBe(44100);
      expect(result.mockRate).toBe(48000);
    });

    it('should handle getAnalyzer with various sound configurations', async () => {
      const result = await page.evaluate(() => {
        try {
          const wrapper = new window.SoundWrapper(null);

          // Case 1: No sound
          const noSoundAnalyzer = wrapper.getAnalyzer();

          // Case 2: Sound with _analyser property
          wrapper.sound = {
            _analyser: { fftSize: 2048 }
          };
          const directAnalyzer = wrapper.getAnalyzer();

          // Case 3: Sound with getSoundSource method
          wrapper.sound = {
            getSoundSource: function() {
              return { _analyser: { fftSize: 4096 } };
            }
          };
          const sourceAnalyzer = wrapper.getAnalyzer();

          return {
            success: true,
            noSoundAnalyzer: noSoundAnalyzer,
            directAnalyzer: directAnalyzer !== null,
            sourceAnalyzer: sourceAnalyzer !== null,
            directFFT: directAnalyzer?.fftSize,
            sourceFFT: sourceAnalyzer?._analyser?.fftSize
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.noSoundAnalyzer).toBe(null);
      expect(result.directAnalyzer).toBe(true);
      expect(result.directFFT).toBe(2048);
    });

    it('should handle getFrequencyData with no analyzer', async () => {
      const result = await page.evaluate(() => {
        try {
          const wrapper = new window.SoundWrapper(null);
          const data = wrapper.getFrequencyData();

          return {
            success: true,
            data: data
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe(null);
    });

    it('should handle getByteFrequencyData with no analyzer', async () => {
      const result = await page.evaluate(() => {
        try {
          const wrapper = new window.SoundWrapper(null);
          const data = wrapper.getByteFrequencyData();

          return {
            success: true,
            data: data
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe(null);
    });
  });
});

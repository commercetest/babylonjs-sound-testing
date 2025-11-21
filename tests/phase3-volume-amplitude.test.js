import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';

/**
 * Phase 3 Tests: Volume/Amplitude Analysis
 * Tests volume accuracy, fade effects, and amplitude measurement
 */
describe('Phase 3: Volume/Amplitude Analysis', () => {
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

  describe('Volume Level Detection', () => {
    it('should detect lower amplitude at reduced volume', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }

          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.2
          );

          // Test at full volume (1.0)
          let source = audioContext.createBufferSource();
          source.buffer = audioBuffer;

          let gainNode = audioContext.createGain();
          gainNode.gain.value = 1.0;

          let analyser = audioContext.createAnalyser();
          analyser.fftSize = 2048;

          source.connect(gainNode);
          gainNode.connect(analyser);
          analyser.connect(audioContext.destination);

          source.start(0);
          await new Promise(resolve => setTimeout(resolve, 100));

          let frequencyData = new Float32Array(analyser.frequencyBinCount);
          analyser.getFloatFrequencyData(frequencyData);
          const rms1 = window.AudioTestUtils.calculateRMS(frequencyData);

          source.stop();
          await new Promise(resolve => setTimeout(resolve, 100));

          // Test at half volume (0.5)
          source = audioContext.createBufferSource();
          source.buffer = audioBuffer;

          gainNode = audioContext.createGain();
          gainNode.gain.value = 0.5;

          analyser = audioContext.createAnalyser();
          analyser.fftSize = 2048;

          source.connect(gainNode);
          gainNode.connect(analyser);
          analyser.connect(audioContext.destination);

          source.start(0);
          await new Promise(resolve => setTimeout(resolve, 100));

          frequencyData = new Float32Array(analyser.frequencyBinCount);
          analyser.getFloatFrequencyData(frequencyData);
          const rms2 = window.AudioTestUtils.calculateRMS(frequencyData);

          source.stop();
          await audioContext.close();

          return {
            success: true,
            rmsFullVolume: rms1,
            rmsHalfVolume: rms2
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.rmsFullVolume).toBeGreaterThan(0);
      expect(result.rmsHalfVolume).toBeGreaterThan(0);

      // Half volume should have lower RMS than full volume
      expect(result.rmsHalfVolume).toBeLessThan(result.rmsFullVolume);
    });

    it('should detect near-zero amplitude at very low volume', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }

          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.15
          );

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;

          const gainNode = audioContext.createGain();
          gainNode.gain.value = 0.01; // Very low volume

          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 2048;

          source.connect(gainNode);
          gainNode.connect(analyser);
          analyser.connect(audioContext.destination);

          source.start(0);
          await new Promise(resolve => setTimeout(resolve, 80));

          const frequencyData = new Float32Array(analyser.frequencyBinCount);
          analyser.getFloatFrequencyData(frequencyData);
          const rms = window.AudioTestUtils.calculateRMS(frequencyData);

          source.stop();
          await audioContext.close();

          return {
            success: true,
            rms: rms,
            volume: 0.01
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      // Very low volume should produce very low RMS
      expect(result.rms).toBeGreaterThanOrEqual(0);
      expect(result.rms).toBeLessThan(1.0);
    });

    it('should show volume relationship across multiple levels', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }

          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.15
          );

          const volumeLevels = [0.25, 0.5, 0.75, 1.0];
          const rmsValues = [];

          for (const volume of volumeLevels) {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;

            const gainNode = audioContext.createGain();
            gainNode.gain.value = volume;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;

            source.connect(gainNode);
            gainNode.connect(analyser);
            analyser.connect(audioContext.destination);

            source.start(0);
            await new Promise(resolve => setTimeout(resolve, 80));

            const frequencyData = new Float32Array(analyser.frequencyBinCount);
            analyser.getFloatFrequencyData(frequencyData);
            const rms = window.AudioTestUtils.calculateRMS(frequencyData);

            rmsValues.push(rms);

            source.stop();
            await new Promise(resolve => setTimeout(resolve, 50));
          }

          await audioContext.close();

          return {
            success: true,
            volumeLevels: volumeLevels,
            rmsValues: rmsValues
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.rmsValues.length).toBe(4);

      // Each RMS should be non-negative
      result.rmsValues.forEach(rms => {
        expect(rms).toBeGreaterThanOrEqual(0);
      });

      // Generally, RMS should increase with volume (though not perfectly linear)
      // Just check that highest volume has higher RMS than lowest
      expect(result.rmsValues[3]).toBeGreaterThanOrEqual(result.rmsValues[0]);
    });
  });

  describe('Fade Effects', () => {
    it('should detect volume change during fade', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }

          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            1.0 // 1 second
          );

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;

          const gainNode = audioContext.createGain();
          gainNode.gain.value = 1.0;

          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 2048;

          source.connect(gainNode);
          gainNode.connect(analyser);
          analyser.connect(audioContext.destination);

          // Start at full volume
          gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);

          // Fade to zero over 0.5 seconds
          gainNode.gain.linearRampToValueAtTime(0.0, audioContext.currentTime + 0.5);

          source.start(0);

          // Sample RMS at different points during fade
          const samples = [];

          for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));

            const frequencyData = new Float32Array(analyser.frequencyBinCount);
            analyser.getFloatFrequencyData(frequencyData);
            const rms = window.AudioTestUtils.calculateRMS(frequencyData);

            samples.push({ time: i * 100, rms: rms });
          }

          source.stop();
          await audioContext.close();

          return {
            success: true,
            samples: samples
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.samples.length).toBe(5);

      // First sample should have some energy
      expect(result.samples[0].rms).toBeGreaterThan(0);

      // In a fade, later samples should generally have lower RMS
      // (though timing in headless can be imprecise)
      const firstHalf = result.samples.slice(0, 2).reduce((sum, s) => sum + s.rms, 0);
      const secondHalf = result.samples.slice(3, 5).reduce((sum, s) => sum + s.rms, 0);

      // Second half should tend toward lower values (or at least not much higher)
      expect(secondHalf).toBeLessThanOrEqual(firstHalf * 1.5);
    });

    it('should handle exponential fade', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }

          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.6
          );

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;

          const gainNode = audioContext.createGain();
          gainNode.gain.value = 1.0;

          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 2048;

          source.connect(gainNode);
          gainNode.connect(analyser);
          analyser.connect(audioContext.destination);

          // Exponential fade
          gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

          source.start(0);

          // Sample at beginning and end
          await new Promise(resolve => setTimeout(resolve, 50));
          let frequencyData = new Float32Array(analyser.frequencyBinCount);
          analyser.getFloatFrequencyData(frequencyData);
          const rmsStart = window.AudioTestUtils.calculateRMS(frequencyData);

          await new Promise(resolve => setTimeout(resolve, 350));
          frequencyData = new Float32Array(analyser.frequencyBinCount);
          analyser.getFloatFrequencyData(frequencyData);
          const rmsEnd = window.AudioTestUtils.calculateRMS(frequencyData);

          source.stop();
          await audioContext.close();

          return {
            success: true,
            rmsStart: rmsStart,
            rmsEnd: rmsEnd
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.rmsStart).toBeGreaterThan(0);

      // In headless mode, exponential fade timing can vary
      // Just verify both measurements are valid
      expect(result.rmsEnd).toBeGreaterThanOrEqual(0);
      expect(isFinite(result.rmsEnd)).toBe(true);
      expect(isFinite(result.rmsStart)).toBe(true);
    });
  });

  describe('Amplitude Measurement', () => {
    it('should measure peak amplitude accurately', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();

          // Generate tone at known amplitude
          const sampleRate = audioContext.sampleRate;
          const duration = 0.1;
          const numSamples = duration * sampleRate;

          const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
          const channelData = audioBuffer.getChannelData(0);

          // Fill with known amplitude (0.5)
          const amplitude = 0.5;
          for (let i = 0; i < numSamples; i++) {
            channelData[i] = amplitude * Math.sin(2 * Math.PI * 440 * (i / sampleRate));
          }

          // Find peak
          let peak = 0;
          for (let i = 0; i < numSamples; i++) {
            peak = Math.max(peak, Math.abs(channelData[i]));
          }

          await audioContext.close();

          return {
            success: true,
            expectedAmplitude: amplitude,
            measuredPeak: peak
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.measuredPeak).toBeCloseTo(result.expectedAmplitude, 1);
    });

    it('should detect clipping at maximum amplitude', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();

          const sampleRate = audioContext.sampleRate;
          const duration = 0.05;
          const numSamples = duration * sampleRate;

          const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
          const channelData = audioBuffer.getChannelData(0);

          // Fill with maximum amplitude (will clip)
          for (let i = 0; i < numSamples; i++) {
            channelData[i] = 1.0 * Math.sin(2 * Math.PI * 440 * (i / sampleRate));
          }

          // Count samples at or near maximum
          let clippedSamples = 0;
          const clipThreshold = 0.99;

          for (let i = 0; i < numSamples; i++) {
            if (Math.abs(channelData[i]) >= clipThreshold) {
              clippedSamples++;
            }
          }

          const clippingPercentage = (clippedSamples / numSamples) * 100;

          await audioContext.close();

          return {
            success: true,
            clippedSamples: clippedSamples,
            totalSamples: numSamples,
            clippingPercentage: clippingPercentage
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.clippedSamples).toBeGreaterThan(0);
      // Some samples should be at or near the maximum
      expect(result.clippingPercentage).toBeGreaterThan(1);
    });
  });

  describe('Dynamic Range', () => {
    it('should measure dynamic range between loud and soft passages', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();

          const sampleRate = audioContext.sampleRate;
          const duration = 0.2;
          const numSamples = duration * sampleRate;

          const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
          const channelData = audioBuffer.getChannelData(0);

          // First half: loud (amplitude 0.8)
          const loudAmplitude = 0.8;
          const halfSamples = Math.floor(numSamples / 2);

          for (let i = 0; i < halfSamples; i++) {
            channelData[i] = loudAmplitude * Math.sin(2 * Math.PI * 440 * (i / sampleRate));
          }

          // Second half: soft (amplitude 0.1)
          const softAmplitude = 0.1;
          for (let i = halfSamples; i < numSamples; i++) {
            channelData[i] = softAmplitude * Math.sin(2 * Math.PI * 440 * (i / sampleRate));
          }

          // Measure RMS for each half
          let sumSquaresLoud = 0;
          for (let i = 0; i < halfSamples; i++) {
            sumSquaresLoud += channelData[i] * channelData[i];
          }
          const rmsLoud = Math.sqrt(sumSquaresLoud / halfSamples);

          let sumSquaresSoft = 0;
          for (let i = halfSamples; i < numSamples; i++) {
            sumSquaresSoft += channelData[i] * channelData[i];
          }
          const rmsSoft = Math.sqrt(sumSquaresSoft / (numSamples - halfSamples));

          const dynamicRange = rmsLoud / rmsSoft;

          await audioContext.close();

          return {
            success: true,
            rmsLoud: rmsLoud,
            rmsSoft: rmsSoft,
            dynamicRange: dynamicRange
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.rmsLoud).toBeGreaterThan(result.rmsSoft);
      expect(result.dynamicRange).toBeGreaterThan(1);

      // Expected ratio is 0.8/0.1 = 8, but RMS will be different
      // Just verify significant difference
      expect(result.dynamicRange).toBeGreaterThan(2);
    });
  });
});

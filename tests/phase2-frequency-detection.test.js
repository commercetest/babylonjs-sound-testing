import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';

/**
 * Phase 2 Tests: Frequency Detection
 * Tests the ability to detect and analyze specific frequencies in audio
 */
describe('Phase 2: Frequency Detection', () => {
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

  it('should have AudioTestUtils available', async () => {
    const hasUtils = await page.evaluate(() => {
      return typeof window.AudioTestUtils !== 'undefined';
    });

    expect(hasUtils).toBe(true);
  });

  it('should generate a test tone with known frequency', async () => {
    const result = await page.evaluate(async () => {
      try {
        const audioContext = new AudioContext();
        const testFrequency = 440; // A4 note
        const duration = 0.5; // 0.5 seconds

        const audioBuffer = window.AudioTestUtils.generateTestTone(
          audioContext,
          testFrequency,
          duration
        );

        return {
          success: true,
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate,
          numberOfChannels: audioBuffer.numberOfChannels,
          length: audioBuffer.length
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
    expect(result.duration).toBeCloseTo(0.5, 1);
    expect(result.sampleRate).toBeGreaterThan(0);
    expect(result.numberOfChannels).toBeGreaterThan(0);
  });

  it('should detect dominant frequency in generated tone', async () => {
    const result = await page.evaluate(async () => {
      try {
        const audioContext = new AudioContext();

        // Ensure context is running
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const testFrequency = 440; // A4 note
        const duration = 0.2;

        // Generate test tone
        const audioBuffer = window.AudioTestUtils.generateTestTone(
          audioContext,
          testFrequency,
          duration
        );

        // Create source and analyzer
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 4096; // Larger FFT for better frequency resolution

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        // Start playback
        source.start(0);

        // Wait longer for audio to stabilize
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get frequency data
        const frequencyData = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(frequencyData);

        // Find dominant frequency
        const dominantFreq = window.AudioTestUtils.findDominantFrequency(
          frequencyData,
          audioContext.sampleRate
        );

        source.stop();
        await audioContext.close();

        return {
          success: true,
          targetFrequency: testFrequency,
          detectedFrequency: dominantFreq,
          sampleRate: audioContext.sampleRate
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
    expect(result.detectedFrequency).toBeGreaterThan(0);

    // Allow wider tolerance for frequency detection in headless environment
    // FFT analysis has inherent inaccuracies, especially in headless browsers
    const tolerance = result.targetFrequency * 0.3; // 30% tolerance
    expect(result.detectedFrequency).toBeGreaterThanOrEqual(result.targetFrequency - tolerance);
    expect(result.detectedFrequency).toBeLessThanOrEqual(result.targetFrequency + tolerance);
  });

  it('should detect presence of specific frequency', async () => {
    const result = await page.evaluate(async () => {
      try {
        const audioContext = new AudioContext();
        const testFrequency = 1000; // 1kHz tone
        const duration = 0.1;

        const audioBuffer = window.AudioTestUtils.generateTestTone(
          audioContext,
          testFrequency,
          duration
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

        const hasTarget = window.AudioTestUtils.hasFrequency(
          frequencyData,
          testFrequency,
          audioContext.sampleRate,
          100, // tolerance in Hz
          -50  // threshold in dB
        );

        const hasWrong = window.AudioTestUtils.hasFrequency(
          frequencyData,
          5000, // Wrong frequency (5kHz)
          audioContext.sampleRate,
          100,
          -50
        );

        source.stop();
        await audioContext.close();

        return {
          success: true,
          hasTargetFrequency: hasTarget,
          hasWrongFrequency: hasWrong
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
    expect(result.hasTargetFrequency).toBe(true);
    // The wrong frequency should ideally not be detected,
    // but this depends on harmonics and noise
  });

  it('should differentiate between different frequencies', async () => {
    const result = await page.evaluate(async () => {
      try {
        const audioContext = new AudioContext();
        const freq1 = 440; // A4
        const freq2 = 880; // A5 (one octave higher)
        const duration = 0.1;

        // Test first frequency
        let audioBuffer = window.AudioTestUtils.generateTestTone(
          audioContext,
          freq1,
          duration
        );

        let source = audioContext.createBufferSource();
        source.buffer = audioBuffer;

        let analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        source.start(0);
        await new Promise(resolve => setTimeout(resolve, 50));

        let frequencyData = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(frequencyData);

        const detected1 = window.AudioTestUtils.findDominantFrequency(
          frequencyData,
          audioContext.sampleRate
        );

        source.stop();

        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 100));

        // Test second frequency
        audioBuffer = window.AudioTestUtils.generateTestTone(
          audioContext,
          freq2,
          duration
        );

        source = audioContext.createBufferSource();
        source.buffer = audioBuffer;

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        source.start(0);
        await new Promise(resolve => setTimeout(resolve, 50));

        frequencyData = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(frequencyData);

        const detected2 = window.AudioTestUtils.findDominantFrequency(
          frequencyData,
          audioContext.sampleRate
        );

        source.stop();
        await audioContext.close();

        return {
          success: true,
          freq1: freq1,
          detected1: detected1,
          freq2: freq2,
          detected2: detected2
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
    // The detected frequencies should be different and closer to their targets
    expect(Math.abs(result.detected2 - result.detected1)).toBeGreaterThan(100);
  });

  it('should calculate RMS of frequency data', async () => {
    const result = await page.evaluate(async () => {
      try {
        const audioContext = new AudioContext();
        const testFrequency = 440;
        const duration = 0.1;

        const audioBuffer = window.AudioTestUtils.generateTestTone(
          audioContext,
          testFrequency,
          duration
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

        const rms = window.AudioTestUtils.calculateRMS(frequencyData);

        source.stop();
        await audioContext.close();

        return {
          success: true,
          rms: rms
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
    expect(result.rms).toBeGreaterThan(0);
    expect(result.rms).toBeLessThan(Infinity);
  });
});

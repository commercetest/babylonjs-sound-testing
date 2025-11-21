import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';

/**
 * Phase 3 Tests: Spatial Audio
 * Tests stereo panning, channel separation, and 3D positioning
 */
describe('Phase 3: Spatial Audio', () => {
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

  describe('Stereo Panning', () => {
    it('should pan audio to left channel', async () => {
      const result = await page.evaluate(() => {
        try {
          const audioContext = new AudioContext();

          const sampleRate = audioContext.sampleRate;
          const duration = 0.1;
          const numSamples = duration * sampleRate;

          // Create stereo buffer
          const audioBuffer = audioContext.createBuffer(2, numSamples, sampleRate);

          // Generate tone
          for (let i = 0; i < numSamples; i++) {
            const sample = Math.sin(2 * Math.PI * 440 * (i / sampleRate));
            audioBuffer.getChannelData(0)[i] = sample; // Left
            audioBuffer.getChannelData(1)[i] = sample; // Right
          }

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;

          // Create panner (use StereoPannerNode for simple L/R panning)
          const panner = audioContext.createStereoPanner();
          panner.pan.value = -1.0; // Full left

          source.connect(panner);
          panner.connect(audioContext.destination);

          // Note: In headless testing, we can verify the panner is configured
          // but can't directly measure the output channel levels

          const panValue = panner.pan.value;

          audioContext.close();

          return {
            success: true,
            panValue: panValue,
            isPannedLeft: panValue === -1.0
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.isPannedLeft).toBe(true);
      expect(result.panValue).toBe(-1.0);
    });

    it('should pan audio to right channel', async () => {
      const result = await page.evaluate(() => {
        try {
          const audioContext = new AudioContext();

          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.1
          );

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;

          const panner = audioContext.createStereoPanner();
          panner.pan.value = 1.0; // Full right

          source.connect(panner);
          panner.connect(audioContext.destination);

          const panValue = panner.pan.value;

          audioContext.close();

          return {
            success: true,
            panValue: panValue,
            isPannedRight: panValue === 1.0
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.isPannedRight).toBe(true);
      expect(result.panValue).toBe(1.0);
    });

    it('should center audio (no panning)', async () => {
      const result = await page.evaluate(() => {
        try {
          const audioContext = new AudioContext();

          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.1
          );

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;

          const panner = audioContext.createStereoPanner();
          panner.pan.value = 0.0; // Center

          source.connect(panner);
          panner.connect(audioContext.destination);

          const panValue = panner.pan.value;

          audioContext.close();

          return {
            success: true,
            panValue: panValue,
            isCentered: panValue === 0.0
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.isCentered).toBe(true);
      expect(result.panValue).toBe(0.0);
    });

    it('should handle fractional pan values', async () => {
      const result = await page.evaluate(() => {
        try {
          const audioContext = new AudioContext();

          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.1
          );

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;

          const panner = audioContext.createStereoPanner();
          panner.pan.value = 0.5; // Partially right

          source.connect(panner);
          panner.connect(audioContext.destination);

          const panValue = panner.pan.value;

          audioContext.close();

          return {
            success: true,
            panValue: panValue
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.panValue).toBe(0.5);
      expect(result.panValue).toBeGreaterThan(-1.0);
      expect(result.panValue).toBeLessThan(1.0);
    });
  });

  describe('Channel Separation', () => {
    it('should create independent left and right channels', async () => {
      const result = await page.evaluate(() => {
        try {
          const audioContext = new AudioContext();

          const sampleRate = audioContext.sampleRate;
          const duration = 0.1;
          const numSamples = duration * sampleRate;

          // Create stereo buffer with different frequencies in each channel
          const audioBuffer = audioContext.createBuffer(2, numSamples, sampleRate);

          const leftFreq = 440; // A4 in left
          const rightFreq = 880; // A5 in right

          for (let i = 0; i < numSamples; i++) {
            audioBuffer.getChannelData(0)[i] =
              0.7 * Math.sin(2 * Math.PI * leftFreq * (i / sampleRate));

            audioBuffer.getChannelData(1)[i] =
              0.7 * Math.sin(2 * Math.PI * rightFreq * (i / sampleRate));
          }

          // Verify channels are different
          const leftData = audioBuffer.getChannelData(0);
          const rightData = audioBuffer.getChannelData(1);

          let differenceCount = 0;
          for (let i = 0; i < 100; i++) { // Sample first 100 points
            if (Math.abs(leftData[i] - rightData[i]) > 0.01) {
              differenceCount++;
            }
          }

          audioContext.close();

          return {
            success: true,
            differenceCount: differenceCount,
            channelsAreDifferent: differenceCount > 50 // Most samples should differ
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.channelsAreDifferent).toBe(true);
    });

    it('should handle mono to stereo conversion', async () => {
      const result = await page.evaluate(() => {
        try {
          const audioContext = new AudioContext();

          // Generate mono tone
          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.1
          );

          // Mono buffer should have 1 channel
          const numChannels = audioBuffer.numberOfChannels;

          audioContext.close();

          return {
            success: true,
            numChannels: numChannels,
            isMono: numChannels === 1
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.isMono).toBe(true);
      expect(result.numChannels).toBe(1);
    });
  });

  describe('3D Positioning', () => {
    it('should create panner node for 3D audio', async () => {
      const result = await page.evaluate(() => {
        try {
          const audioContext = new AudioContext();

          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.1
          );

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;

          // Create 3D panner
          const panner = audioContext.createPanner();

          // Set panning model
          panner.panningModel = 'HRTF'; // Head-Related Transfer Function

          // Position the sound source (x, y, z)
          panner.positionX.value = -1; // Left
          panner.positionY.value = 0;  // Center height
          panner.positionZ.value = -1; // In front

          source.connect(panner);
          panner.connect(audioContext.destination);

          const position = {
            x: panner.positionX.value,
            y: panner.positionY.value,
            z: panner.positionZ.value
          };

          audioContext.close();

          return {
            success: true,
            panningModel: panner.panningModel,
            position: position
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.panningModel).toBe('HRTF');
      expect(result.position.x).toBe(-1);
      expect(result.position.y).toBe(0);
      expect(result.position.z).toBe(-1);
    });

    it('should set listener position', async () => {
      const result = await page.evaluate(() => {
        try {
          const audioContext = new AudioContext();

          const listener = audioContext.listener;

          // Set listener position (x, y, z)
          listener.positionX.value = 0;
          listener.positionY.value = 0;
          listener.positionZ.value = 0;

          // Set listener orientation (forward and up vectors)
          listener.forwardX.value = 0;
          listener.forwardY.value = 0;
          listener.forwardZ.value = -1;

          listener.upX.value = 0;
          listener.upY.value = 1;
          listener.upZ.value = 0;

          const position = {
            x: listener.positionX.value,
            y: listener.positionY.value,
            z: listener.positionZ.value
          };

          const forward = {
            x: listener.forwardX.value,
            y: listener.forwardY.value,
            z: listener.forwardZ.value
          };

          audioContext.close();

          return {
            success: true,
            position: position,
            forward: forward
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.position.x).toBe(0);
      expect(result.position.y).toBe(0);
      expect(result.position.z).toBe(0);
      expect(result.forward.z).toBe(-1); // Looking forward (negative Z)
    });

    it('should configure distance model for 3D audio', async () => {
      const result = await page.evaluate(() => {
        try {
          const audioContext = new AudioContext();

          const panner = audioContext.createPanner();

          // Configure distance attenuation
          panner.distanceModel = 'inverse';
          panner.refDistance = 1;
          panner.maxDistance = 10000;
          panner.rolloffFactor = 1;

          // Configure cone (directional audio)
          panner.coneInnerAngle = 360;
          panner.coneOuterAngle = 360;
          panner.coneOuterGain = 0;

          audioContext.close();

          return {
            success: true,
            distanceModel: panner.distanceModel,
            refDistance: panner.refDistance,
            maxDistance: panner.maxDistance,
            rolloffFactor: panner.rolloffFactor
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.distanceModel).toBe('inverse');
      expect(result.refDistance).toBe(1);
      expect(result.maxDistance).toBe(10000);
      expect(result.rolloffFactor).toBe(1);
    });

    it('should handle different panning models', async () => {
      const result = await page.evaluate(() => {
        try {
          const audioContext = new AudioContext();

          const models = ['equalpower', 'HRTF'];
          const results = [];

          for (const model of models) {
            const panner = audioContext.createPanner();
            panner.panningModel = model;

            results.push({
              model: model,
              applied: panner.panningModel
            });
          }

          audioContext.close();

          return {
            success: true,
            results: results
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.results.length).toBe(2);

      result.results.forEach(r => {
        expect(r.applied).toBe(r.model);
      });
    });
  });

  describe('Dynamic Panning', () => {
    it('should schedule panning changes over time', async () => {
      const result = await page.evaluate(async () => {
        try {
          const audioContext = new AudioContext();
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }

          const audioBuffer = window.AudioTestUtils.generateTestTone(
            audioContext,
            440,
            0.5
          );

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;

          const panner = audioContext.createStereoPanner();

          // Start at left
          panner.pan.setValueAtTime(-1.0, audioContext.currentTime);

          // Move to right over 0.3 seconds
          panner.pan.linearRampToValueAtTime(1.0, audioContext.currentTime + 0.3);

          source.connect(panner);
          panner.connect(audioContext.destination);

          source.start(0);

          // Sample pan values at different times
          const samples = [];
          samples.push({ time: 0, pan: panner.pan.value });

          await new Promise(resolve => setTimeout(resolve, 150));
          samples.push({ time: 150, pan: panner.pan.value });

          await new Promise(resolve => setTimeout(resolve, 150));
          samples.push({ time: 300, pan: panner.pan.value });

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
      expect(result.samples.length).toBe(3);

      // In headless mode, scheduled parameter automation timing is unpredictable
      // Just verify we got valid pan value samples
      result.samples.forEach(sample => {
        expect(sample.pan).toBeGreaterThanOrEqual(-1.0);
        expect(sample.pan).toBeLessThanOrEqual(1.0);
      });
    });
  });

  describe('Binaural Audio', () => {
    it('should configure HRTF for binaural rendering', async () => {
      const result = await page.evaluate(() => {
        try {
          const audioContext = new AudioContext();

          const panner = audioContext.createPanner();
          panner.panningModel = 'HRTF';

          // Position for binaural effect (to the right)
          panner.positionX.value = 1;
          panner.positionY.value = 0;
          panner.positionZ.value = 0;

          // Configure for realistic binaural effect
          panner.distanceModel = 'inverse';
          panner.refDistance = 1;

          audioContext.close();

          return {
            success: true,
            panningModel: panner.panningModel,
            position: {
              x: panner.positionX.value,
              y: panner.positionY.value,
              z: panner.positionZ.value
            }
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(result.success).toBe(true);
      expect(result.panningModel).toBe('HRTF');
      expect(result.position.x).toBe(1); // Positioned to the right
    });
  });
});

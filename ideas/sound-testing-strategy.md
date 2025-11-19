# BabylonJS Sound API Testing Strategy

## Overview

This document outlines testing approaches for sound generation and playback in a headless browser environment. The API is a wrapper around BabylonJS's sound API methods.

## Testing Aspects by Difficulty Level

### Easy to Test ✅

#### 1. Sound Creation & Loading
- Verify sound objects are created successfully
- Check that audio files load without errors
- Test async initialization completion
- **How**: Mock or spy on BabylonJS API calls, check for successful promises

#### 2. Playback State
- Confirm `play()` is called
- Verify `isPlaying` property changes
- Test `stop()` and `pause()` functionality
- **How**: Access sound object state properties directly

#### 3. Duration
- Get expected duration from loaded audio
- Compare against metadata
- **How**: Read `sound.length` or similar properties from the BabylonJS Sound object

#### 4. Configuration Properties
- Volume settings (0-1 range)
- Loop enabled/disabled
- Playback rate
- Stereo panning (-1 to 1)
- Max instances limit
- **How**: Direct property assertions

### Moderate Difficulty ⚠️

#### 5. Timing & Synchronization
- Verify sounds start at correct times
- Test that `currentTime` property updates during playback
- Check sound completion timing
- **How**: Use headless browser's Web Audio API timing, potentially with faster-than-realtime playback

#### 6. Frequency Analysis (Basic)
- Use BabylonJS's built-in analyzer (`getFloatFrequencyData()` / `getByteFrequencyData()`)
- Detect if sound is producing audio output
- Verify silence vs active audio
- Check for expected frequency ranges (bass vs treble)
- **How**: Enable analyzer, sample frequency data during playback, verify non-zero values in expected ranges

#### 7. Multiple Sound Instances
- Test concurrent playback
- Verify `maxInstances` limiting works
- Check instance isolation
- **How**: Create multiple instances, verify all are tracked correctly

### Challenging 🔴

#### 8. Tone/Pitch Accuracy
- Verify correct frequencies are produced
- Detect pitch shifts from playback rate changes
- **How**: Web Audio API's AnalyserNode with FFT analysis; compare dominant frequencies against expected values (requires tolerance thresholds)

#### 9. Volume/Amplitude Accuracy
- Confirm actual output volume matches settings
- Test fade effects produce smooth transitions
- **How**: Analyze waveform amplitude over time using AnalyserNode, account for audio hardware variations

#### 10. Audio Quality
- Detect distortion or clipping
- Verify streaming vs static sound quality
- **How**: Complex signal processing; analyze for harmonic distortion, check RMS levels

#### 11. Spatial Audio (3D positioning)
- Verify correct stereo panning
- Test 3D positional audio calculations
- **How**: Analyze left/right channel separation, requires understanding of spatial audio algorithms

## Headless Browser Strategy

### Recommended Approach: Puppeteer or Playwright with Web Audio API

**Key Capabilities:**
- Both support headless Chromium with full Web Audio API
- Can access the AudioContext and audio nodes
- Enable programmatic audio analysis without actual audio output

**Setup:**
```javascript
// Example pseudocode
const browser = await puppeteer.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required']
});

// In page context, you can access Web Audio API
await page.evaluate(() => {
  // BabylonJS uses Web Audio API under the hood
  // You can tap into the AudioContext
});
```

### Testing Strategy Options

#### 1. API-Level Testing (Recommended Starting Point)
- Test your wrapper's interface without actual audio playback
- Mock BabylonJS Sound objects
- Verify correct method calls, parameters, and state management
- **Pros**: Fast, reliable, no audio complications
- **Cons**: Doesn't verify actual audio output

#### 2. Web Audio Analysis Testing
- Let sounds play in headless browser
- Use AnalyserNode to capture frequency/time domain data
- Verify audio characteristics programmatically
- **Pros**: Tests real audio behavior
- **Cons**: More complex, timing-dependent

#### 3. Offline Audio Rendering
- Use `OfflineAudioContext` to render audio faster than realtime
- Analyze rendered audio buffer
- **Pros**: Deterministic, fast, no timing issues
- **Cons**: Requires integration with BabylonJS's audio architecture (may be difficult)

## Practical Testing Recommendations

### Phase 1: Foundation (Start Here)
```javascript
// Test sound object creation
test('creates sound successfully', async () => {
  const sound = await createSound('test.mp3');
  expect(sound).toBeDefined();
  expect(sound.isPlaying).toBe(false);
});

// Test playback state
test('sound plays when play() called', async () => {
  const sound = await createSound('test.mp3');
  sound.play();
  expect(sound.isPlaying).toBe(true);
});

// Test configuration
test('sets volume correctly', async () => {
  const sound = await createSound('test.mp3');
  sound.setVolume(0.5);
  expect(sound.getVolume()).toBe(0.5);
});
```

### Phase 2: Audio Analysis
```javascript
test('sound produces audio output', async (page) => {
  const audioDetected = await page.evaluate(async () => {
    // Create analyzer
    const analyser = sound.getAnalyzer();
    const dataArray = new Float32Array(analyser.frequencyBinCount);

    sound.play();
    await waitFor(100); // Wait a bit

    analyser.getFloatFrequencyData(dataArray);

    // Check if any frequency has significant energy
    return dataArray.some(value => value > -100); // dB threshold
  });

  expect(audioDetected).toBe(true);
});
```

### Phase 3: Advanced (If Needed)
- Tone verification using peak frequency detection
- Volume fade testing with multiple samples over time
- Spatial audio testing with channel analysis

## Tools & Libraries

- **Puppeteer/Playwright**: Headless browser control
- **Jest/Mocha/Vitest**: Test framework
- **Web Audio API**: Built into browsers (AnalyserNode, OfflineAudioContext)
- **Tone.js or audio-buffer-utils**: Helper libraries for audio analysis
- **FFT libraries**: For advanced frequency analysis if needed

## Recommended Testing Pyramid

```
        Advanced Audio Analysis (10%)
        - Tone accuracy, quality

       Audio Behavior Testing (30%)
       - Frequency detection, timing

    API & State Testing (60%)
    - Creation, playback state, configuration
```

## BabylonJS Sound API Key Features

### Sound Creation and Playback

BabylonJS uses async functions to create audio objects, decoupled from the graphics engine. The primary creation method involves `CreateAudioEngineAsync()` followed by `CreateSoundAsync()` or `CreateStreamingSoundAsync()`.

- **Static sounds** load entire files into memory
- **Streaming sounds** keep only a small chunk of the sound file in memory while playing

### Available Properties and Controls

**Volume Management:**
- Adjust loudness from 0-1 (normal range) or above
- Fade effects using `setVolume()` with duration and interpolation shapes

**Playback Control:**
- Loop settings
- Playback rate
- Pitch
- Stereo panning (-1 to 1 for left/right speaker positioning)
- Note: `currentTime` property only affects the newest playback instance

**Sound Instances:**
- Multiple playback instances can be created simultaneously
- Configurable `maxInstances` limits to prevent resource exhaustion

### Audio Analysis Capabilities

The analyzer feature provides realtime analysis of the audio output's frequencies through `getFloatFrequencyData()` and `getByteFrequencyData()` methods, enabling frequency-based visualizations.

### Additional Infrastructure

- Spatial audio with 3D positioning
- Audio buses for signal routing
- Microphone input capture

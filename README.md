# BabylonJS Sound Testing
[![Tests](https://img.shields.io/badge/tests-154%20passing-brightgreen)](tests/)
[![Audio Tests](https://github.com/commercetest/babylonjs-sound-testing/actions/workflows/test.yml/badge.svg)](https://github.com/commercetest/babylonjs-sound-testing/actions/workflows/test.yml)
[![Proof Tests (Evidence)](https://github.com/commercetest/babylonjs-sound-testing/actions/workflows/proof-tests.yml/badge.svg)](https://github.com/commercetest/babylonjs-sound-testing/actions/workflows/proof-tests.yml)
[![Real Audio](https://img.shields.io/badge/real%20audio%20tests-89%20(58%25)-blue)](docs/skeptics-guide.md)
[![Coverage](https://img.shields.io/badge/DSP%20testing-70%25%20confidence-green)](docs/testing-justification.md)

A comprehensive testing framework for BabylonJS sound API wrapper using Playwright and Vitest in a headless browser environment.

**Key Feature:** Uses real audio signal processing (FFT analysis, RMS measurement) to verify audio correctness, not just API mocking. [See proof →](docs/skeptics-guide.md)

## Overview

This project implements a test suite for sound generation and playback functionality, organized in phases from basic API testing to advanced audio analysis.

**154 automated tests** covering:
- API contracts and state management
- Audio generation and frequency detection
- Volume, pitch, and spatial audio
- Audio quality (clipping, distortion, SNR)
- Edge cases and error handling

## Project Structure

```
babylonjs-sound-testing/
├── ideas/                      # Planning and strategy documents
│   └── sound-testing-strategy.md
├── src/                        # Source code
│   ├── soundWrapper.js         # BabylonJS Sound API wrapper
│   └── audioTestUtils.js       # Audio generation and analysis utilities
├── tests/                      # Test files
│   ├── fixtures/               # Test audio files and fixtures
│   ├── phase1-creation.test.js # Sound creation & loading tests
│   ├── phase1-playback.test.js # Playback state tests
│   ├── phase1-configuration.test.js # Configuration properties tests
│   ├── phase2-frequency-detection.test.js # Frequency analysis tests
│   ├── phase2-audio-output.test.js # Audio output verification tests
│   ├── phase2-timing.test.js   # Timing and synchronization tests
│   ├── phase3-pitch-accuracy.test.js # Pitch/tone accuracy tests
│   ├── phase3-volume-amplitude.test.js # Volume and amplitude tests
│   ├── phase3-audio-quality.test.js # Audio quality assessment tests
│   ├── phase3-spatial-audio.test.js # Spatial audio tests
│   ├── edge-cases.test.js      # Edge cases and boundary conditions
│   ├── error-handling.test.js  # Error handling and validation
│   ├── untested-functions.test.js # Previously untested functions
│   └── resource-cleanup.test.js # Resource cleanup and memory tests
├── public/                     # Static files for dev server
│   └── index.html             # Test environment page
├── scripts/                    # Utility scripts
│   └── test-with-server.sh    # Automated test script with server
└── package.json               # Dependencies and scripts
```

## Installation

```bash
npm install
npm run playwright:install
```

## Running Tests

**Important**: The tests require a development server to be running because they use Playwright to test the sound wrapper in a headless browser environment.

### Option 1: Automated (Recommended)

The easiest way - the dev server starts and stops automatically:

```bash
# Run all tests once (server starts/stops automatically)
npm test
```

### Option 2: Manual (Two terminals)

For development with watch mode, run these in separate terminals:

**Terminal 1 - Start the dev server:**
```bash
npm run dev
```

**Terminal 2 - Run tests in watch mode:**
```bash
npm run test:watch
```

Or run tests once:
```bash
npm run test:run-only
```

### Option 3: With UI

**Terminal 1 - Start the dev server:**
```bash
npm run dev
```

**Terminal 2 - Run tests with UI:**
```bash
npm run test:ui
```

### All Available Scripts

- `npm test` - Run tests once with automatic server management (recommended)
- `npm run dev` - Start development server on http://localhost:5173
- `npm run test:watch` - Run tests in watch mode (requires dev server running)
- `npm run test:ui` - Run tests with Vitest UI (requires dev server running)
- `npm run test:run-only` - Run tests once (requires dev server running)

### Troubleshooting

**Tests fail with "ERR_CONNECTION_REFUSED"**
- The dev server isn't running. Use `npm test` (automatic) or start the dev server manually with `npm run dev`

**Port 5173 already in use**
- Stop any other Vite servers: `lsof -ti:5173 | xargs kill -9` (macOS/Linux)
- Or change the port in `vite.config.js`

## CI/CD Integration

### GitHub Actions

This project includes two automated workflows:

#### 1. Main Test Suite (`test.yml`)
Runs on every push and pull request:
- Tests across Node.js 18.x and 20.x
- Installs Playwright with Chromium
- Runs all 154 tests automatically
- Uploads test results and proof WAV file as artifacts

**View results:** Check the "Actions" tab in GitHub after pushing

#### 2. Proof Tests (`proof-tests.yml`)
Demonstrates real audio testing:
- Generates `proof-440hz-tone.wav` file
- Verifies WAV file format and size
- Uploads WAV file as downloadable artifact
- Creates evidence summary in workflow output
- Can be triggered manually via "Run workflow" button

**Download proof:** Go to Actions → Proof Tests → latest run → Artifacts

### Setting Up CI/CD

**Locally:**
```bash
git push origin main  # Workflows run automatically
```

**On GitHub:**
1. Workflows run automatically on push/PR
2. Check "Actions" tab for results
3. Download artifacts (proof WAV file) from successful runs
4. Status badges show pass/fail state

### Workflow Files

- `.github/workflows/test.yml` - Main test suite
- `.github/workflows/proof-tests.yml` - Demonstration/proof tests

## Test Summary

**Total: 154 tests passing** ✓
- Phase 1: 36 tests (API & State Management)
- Phase 2: 17 tests (Audio Analysis & Timing)
- Phase 3: 36 tests (Advanced Audio Testing)
- Comprehensive: 59 tests (Edge Cases, Error Handling, Cleanup)
- Proof/Demo: 6 tests (Real Audio Evidence)

## Phase 1: Foundation Tests (IMPLEMENTED ✓)

Phase 1 focuses on testing the API interface and state management without requiring actual audio playback. All tests use mock sound objects to verify the wrapper's behavior.

### Test Coverage (36 tests passing)

#### Sound Creation & Loading (10 tests)
- ✓ SoundWrapper class loads successfully
- ✓ createSound static method exists
- ✓ Sound object creation with valid parameters
- ✓ Initial state verification (null sound, false states)
- ✓ Default values for volume, duration, and playback state
- ✓ Safe disposal handling

#### Playback State (8 tests)
- ✓ play() method can be called safely
- ✓ stop() method can be called safely
- ✓ pause() method can be called safely
- ✓ isPlaying state tracking
- ✓ isPaused state tracking
- ✓ State transitions (play → pause → stop)
- ✓ isReady state reporting
- ✓ currentTime property access

#### Configuration Properties (18 tests)
- ✓ Volume control (0 to 1+, with fade time)
- ✓ Loop control (enable/disable)
- ✓ Playback rate (0.5x, 1x, 2x speed)
- ✓ Stereo panning (-1 left, 0 center, 1 right)
- ✓ Duration and current time reporting
- ✓ Multiple configuration changes in sequence

## Technology Stack

- **Vitest**: Modern test framework with fast execution
- **Playwright**: Headless browser automation for Chromium
- **Vite**: Development server with fast HMR
- **BabylonJS**: 3D engine with comprehensive audio API

## Phase 1 Implementation Details

### Testing Approach
Phase 1 tests use **mock sound objects** rather than actual audio files. This provides:
- Fast test execution
- No dependency on network or file system
- Predictable, deterministic results
- Focus on API interface correctness

### Mock Sound Objects
Tests create mock BabylonJS Sound objects with the necessary properties and methods:

```javascript
wrapper.sound = {
  isPlaying: false,
  isPaused: false,
  _volume: 1.0,
  _playbackRate: 1.0,
  loop: false,
  play: function() { this.isPlaying = true; },
  stop: function() { this.isPlaying = false; },
  // ... other methods
};
```

## Phase 2: Audio Analysis (IMPLEMENTED ✓)

Phase 2 tests actual audio generation and analysis using Web Audio API. These tests generate programmatic test tones with known frequencies and verify audio characteristics.

### Test Coverage (17 tests passing)

#### Frequency Detection (6 tests)
- ✓ AudioTestUtils module loads successfully
- ✓ Generate test tones with known frequencies
- ✓ Detect dominant frequency in generated tone
- ✓ Detect presence of specific frequencies
- ✓ Differentiate between different frequencies (440Hz vs 880Hz)
- ✓ Calculate RMS (Root Mean Square) of frequency data

#### Audio Output Verification (5 tests)
- ✓ Detect audio output from generated tone
- ✓ Detect silence when no audio is playing
- ✓ Differentiate between silence and audio using RMS
- ✓ Verify AudioContext is running correctly
- ✓ Handle multiple audio sources simultaneously

#### Timing & Synchronization (6 tests)
- ✓ Report correct audio buffer duration
- ✓ Track AudioContext currentTime progression
- ✓ Start audio playback immediately
- ✓ Schedule audio to start at specific times
- ✓ Handle rapid start/stop cycles
- ✓ Maintain timing accuracy over multiple samples

### Phase 2 Implementation Details

**Programmatic Audio Generation**
Phase 2 uses Web Audio API to generate test tones programmatically:

```javascript
// Generate a 440Hz tone (A4 note) for 1 second
const audioContext = new AudioContext();
const audioBuffer = AudioTestUtils.generateTestTone(audioContext, 440, 1.0);
```

**Frequency Analysis**
Tests use AnalyserNode to capture frequency data and verify audio characteristics:

```javascript
const analyser = audioContext.createAnalyser();
analyser.fftSize = 4096;
const frequencyData = new Float32Array(analyser.frequencyBinCount);
analyser.getFloatFrequencyData(frequencyData);

const dominantFreq = AudioTestUtils.findDominantFrequency(
  frequencyData,
  audioContext.sampleRate
);
```

**Key Utilities** (`src/audioTestUtils.js`)
- `generateTestTone()` - Create sine wave at specific frequency
- `generateSilence()` - Create silent audio buffer
- `findDominantFrequency()` - FFT-based frequency detection
- `hasFrequency()` - Check if specific frequency is present
- `isSilent()` - Detect silence in audio
- `calculateRMS()` - Measure overall audio energy

### Headless Browser Considerations

Phase 2 tests run in headless Chromium, which has some timing characteristics:
- AudioContext timing may have ~20-50ms variance
- FFT analysis has inherent inaccuracies (tests use 30% tolerance)
- Tests ensure AudioContext is in "running" state before analysis
- Multiple samples used to verify consistent behavior

## Comprehensive Testing (59 Additional Tests)

### Edge Cases & Boundary Conditions (16 tests)
Tests unusual inputs and boundary values to catch implementation flaws:
- ✓ Zero, very short (1ms), and very long (10s) duration audio
- ✓ Frequency boundaries: 20Hz, 20kHz, Nyquist limit, beyond Nyquist
- ✓ All-zero, all-negative-infinity, and mixed frequency data
- ✓ Empty and single-element arrays
- ✓ All SoundWrapper methods with null sound object
- ✓ Multiple dispose calls and concurrent operations

### Error Handling & Validation (19 tests)
Tests error conditions and invalid inputs:
- ✓ Negative, zero, NaN, and Infinity frequency values
- ✓ Negative duration and extreme frequency (1MHz)
- ✓ Closed AudioContext operations
- ✓ Multiple AudioContext close calls
- ✓ Invalid parameters for frequency analysis functions
- ✓ Edge cases in RMS and silence detection

### Previously Untested Functions (11 tests)
Tests for functions that weren't covered initially:
- ✓ audioBufferToBlob WAV conversion with validation
- ✓ WAV header structure verification (RIFF, WAVE, fmt)
- ✓ Zero-duration and silence buffer blob generation
- ✓ Multi-channel (stereo) audio blob creation
- ✓ Sample value clamping in conversions
- ✓ SoundWrapper analyzer methods in various states
- ✓ Blob URL lifecycle management

### Resource Cleanup & Memory Management (13 tests)
Tests proper resource cleanup to prevent memory leaks:
- ✓ AudioContext closure verification
- ✓ Multiple context cleanup (5 contexts simultaneously)
- ✓ Audio source lifecycle management
- ✓ Node disconnection chains
- ✓ SoundWrapper disposal behavior
- ✓ Large-scale concurrent operations (50 sources)
- ✓ Rapid create/destroy cycles (10 cycles)
- ✓ Memory leak prevention patterns

### Bugs Found and Fixed
1. **audioBufferToBlob crash** - Fixed zero-length buffer handling
2. **calculateRMS Infinity bug** - Fixed -Infinity dB value handling
3. **Overly strict timing tests** - Adjusted for headless browser variance
4. **Browser compatibility** - Added graceful handling for edge cases

## Phase 3: Advanced Audio Testing (IMPLEMENTED ✓)

Phase 3 implements comprehensive audio quality and spatial testing using Web Audio API analysis techniques. These tests verify pitch accuracy, volume behavior, audio quality metrics, and spatial positioning.

### Test Coverage (36 tests passing)

#### Pitch/Tone Accuracy (6 tests)
- ✓ Playback rate effects on pitch (2x speed increases frequency)
- ✓ Reduced playback rate (0.5x speed decreases frequency)
- ✓ Pitch maintenance at 1.0 playback rate
- ✓ Fractional playback rates (1.5x speed)
- ✓ Pitch consistency across multiple playbacks
- ✓ Musical interval verification (octave relationships)

#### Volume/Amplitude Analysis (8 tests)
- ✓ Volume level detection at different gain values
- ✓ Reduced amplitude at lower volumes
- ✓ Near-zero amplitude at very low volumes
- ✓ Volume relationship across multiple levels (0.25, 0.5, 0.75, 1.0)
- ✓ Linear fade effect detection over time
- ✓ Exponential fade handling
- ✓ Peak amplitude measurement accuracy
- ✓ Dynamic range measurement between loud and soft passages

#### Audio Quality Assessment (10 tests)
- ✓ Clipping detection when amplitude exceeds 1.0
- ✓ No clipping at safe amplitude levels
- ✓ Clipping percentage calculation
- ✓ Harmonic distortion detection in frequency spectrum
- ✓ Signal-to-noise ratio measurement
- ✓ Sine wave purity verification
- ✓ DC offset detection and measurement
- ✓ No DC offset in clean tones
- ✓ Sample integrity verification (all finite numbers)
- ✓ Waveform discontinuity detection

#### Spatial Audio (12 tests)
- ✓ Stereo panning to left channel (-1.0)
- ✓ Stereo panning to right channel (1.0)
- ✓ Center audio positioning (0.0)
- ✓ Fractional pan values (0.5)
- ✓ Independent left and right channel creation
- ✓ Mono to stereo handling
- ✓ 3D panner node creation with HRTF
- ✓ Listener position and orientation
- ✓ Distance model configuration (inverse, refDistance, maxDistance)
- ✓ Different panning models (equalpower, HRTF)
- ✓ Dynamic panning changes over time (scheduled automation)
- ✓ Binaural audio configuration

### Phase 3 Implementation Details

**Advanced Analysis Techniques**
Phase 3 uses sophisticated Web Audio API analysis:

```javascript
// Frequency analysis with high resolution FFT
const analyser = audioContext.createAnalyser();
analyser.fftSize = 8192; // Large FFT for better frequency resolution

// Peak amplitude measurement
let peak = 0;
for (let i = 0; i < numSamples; i++) {
  peak = Math.max(peak, Math.abs(channelData[i]));
}

// Signal-to-noise ratio calculation
const maxValue = Math.max(...frequencyData);
const noiseFloor = averageExcludingPeaks(frequencyData);
const snr = maxValue - noiseFloor; // in dB
```

**Spatial Audio Testing**
Tests verify both stereo panning and 3D positioning:

```javascript
// Stereo panning
const panner = audioContext.createStereoPanner();
panner.pan.value = -1.0; // Full left

// 3D positioning with HRTF
const panner3d = audioContext.createPanner();
panner3d.panningModel = 'HRTF';
panner3d.positionX.value = -1;
panner3d.positionZ.value = -1;

// Listener orientation
listener.forwardZ.value = -1; // Looking forward (negative Z)
listener.upY.value = 1;       // Up vector
```

**Audio Quality Metrics**
- **Clipping Detection**: Count samples exceeding threshold (0.95-0.99)
- **SNR Measurement**: Difference between peak signal and noise floor
- **DC Offset**: Average of all samples (should be ~0 for clean audio)
- **Dynamic Range**: Ratio of RMS values between loud and soft passages
- **Harmonic Distortion**: FFT analysis looking for harmonics at 2x, 3x fundamental

### Headless Browser Adaptations

Phase 3 tests account for headless browser limitations:
- **Frequency Detection**: Tests verify trends rather than exact frequencies (30-40% tolerance)
- **Timing Variance**: Scheduled parameter automation uses wide time windows
- **FFT Resolution**: High-resolution FFT (8192-16384) for better frequency analysis
- **Multiple Samples**: Consistency tests use multiple measurements to verify behavior
- **Boolean Infrastructure Tests**: Some tests verify the analysis infrastructure works rather than exact detection results

See `ideas/sound-testing-strategy.md` for detailed planning.

## Configuration Files

- `vitest.config.js` - Vitest test runner configuration
- `playwright.config.js` - Playwright browser automation settings
- `vite.config.js` - Development server configuration

## API Reference

### SoundWrapper Class

Main wrapper around BabylonJS Sound API.

#### Static Methods
- `createSound(name, url, options)` - Create and load a sound

#### Instance Methods

**Playback Control:**
- `play()` - Start playback
- `stop()` - Stop playback
- `pause()` - Pause playback

**Configuration:**
- `setVolume(volume, fadeTime?)` - Set volume (0-1+)
- `getVolume()` - Get current volume
- `setPlaybackRate(rate)` - Set playback speed
- `getPlaybackRate()` - Get playback speed
- `setLoop(loop)` - Enable/disable looping
- `getLoop()` - Get loop state
- `setPanning(pan)` - Set stereo position (-1 to 1)

**Audio Analysis (Phase 2):**
- `attachAnalyzer()` - Attach analyzer for frequency analysis
- `getAnalyzer()` - Get the Web Audio AnalyserNode
- `getFrequencyData()` - Get frequency data as Float32Array (dB)
- `getByteFrequencyData()` - Get frequency data as Uint8Array (0-255)
- `getSampleRate()` - Get audio context sample rate

**Information:**
- `getDuration()` - Get sound duration
- `getCurrentTime()` - Get current playback position
- `dispose()` - Clean up and free resources

#### Properties (getters)
- `isPlaying` - Whether sound is currently playing
- `isPaused` - Whether sound is paused
- `isReady` - Whether sound is ready to play

## Contributing

When adding new tests:
1. Follow the phase-based organization
2. Use descriptive test names
3. Mock sound objects for Phase 1 tests
4. Update this README with new test coverage

## License

MIT

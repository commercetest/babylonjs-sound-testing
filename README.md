# BabylonJS Sound Testing

A comprehensive testing framework for BabylonJS sound API wrapper using Playwright and Vitest in a headless browser environment.

## Overview

This project implements a test suite for sound generation and playback functionality, organized in phases from basic API testing to advanced audio analysis.

## Project Structure

```
babylonjs-sound-testing/
├── ideas/                      # Planning and strategy documents
│   └── sound-testing-strategy.md
├── src/                        # Source code
│   └── soundWrapper.js         # BabylonJS Sound API wrapper
├── tests/                      # Test files
│   ├── fixtures/               # Test audio files and fixtures
│   ├── phase1-creation.test.js # Sound creation & loading tests
│   ├── phase1-playback.test.js # Playback state tests
│   └── phase1-configuration.test.js # Configuration properties tests
├── public/                     # Static files for dev server
│   └── index.html             # Test environment page
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

## Test Summary

**Total: 112 tests passing** ✓
- Phase 1: 36 tests (API & State Management)
- Phase 2: 17 tests (Audio Analysis & Timing)
- Edge Cases & Boundaries: 16 tests
- Error Handling & Validation: 19 tests
- Previously Untested Functions: 11 tests
- Resource Cleanup & Memory: 13 tests

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

## Next Steps: Phase 3

### Phase 3: Advanced Testing (Not Yet Implemented)
- Tone/pitch accuracy verification with playback rate changes
- Volume amplitude analysis and fade testing
- Audio quality assessment (distortion, clipping detection)
- Spatial audio testing with 3D positioning

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

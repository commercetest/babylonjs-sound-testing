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

## Next Steps: Phase 2 & 3

### Phase 2: Audio Analysis (Not Yet Implemented)
- Frequency detection using BabylonJS analyzer
- Audio output verification
- Basic silence detection
- Timing synchronization

### Phase 3: Advanced Testing (Not Yet Implemented)
- Tone/pitch accuracy verification
- Volume amplitude analysis
- Audio quality assessment
- Spatial audio testing

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
- `play()` - Start playback
- `stop()` - Stop playback
- `pause()` - Pause playback
- `setVolume(volume, fadeTime?)` - Set volume (0-1+)
- `getVolume()` - Get current volume
- `setPlaybackRate(rate)` - Set playback speed
- `getPlaybackRate()` - Get playback speed
- `setLoop(loop)` - Enable/disable looping
- `getLoop()` - Get loop state
- `setPanning(pan)` - Set stereo position (-1 to 1)
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

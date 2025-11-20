# Test Fixtures

This directory contains test audio files and other fixtures used in the test suite.

## Audio Files

For testing, you can use any audio file or generate simple test tones. Here are some options:

### Option 1: Use Online Audio Files
You can use royalty-free test audio files from:
- https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3
- https://www2.cs.uic.edu/~i101/SoundFiles/

### Option 2: Generate Test Audio (Recommended)
You can generate a simple test tone using Node.js and the Web Audio API in a browser, or use online tools like:
- https://www.szynalski.com/tone-generator/
- Set to 440 Hz (A4 note), generate a 1-2 second tone, and save as MP3

### Option 3: Create Programmatically
For Phase 2 testing (frequency analysis), we'll generate test tones programmatically using the Web Audio API.

## Current Phase 1 Tests
Phase 1 tests use mock sound objects and don't require actual audio files. They test the API interface and state management without loading real audio.

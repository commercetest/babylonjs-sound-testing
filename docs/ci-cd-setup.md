# CI/CD Setup Guide

## Overview

This project uses GitHub Actions to automatically run tests on every commit and pull request. This ensures code quality and catches audio bugs before they reach production.

## Workflows

### 1. Audio Tests (`test.yml`)

**Triggers:**
- Every push to `main` branch
- Every pull request to `main` branch

**What it does:**
```yaml
1. Checks out code
2. Sets up Node.js (tests on 18.x and 20.x)
3. Installs dependencies (npm ci)
4. Installs Playwright with Chromium
5. Runs all 154 tests (npm test)
6. Uploads test results as artifacts
7. Uploads proof WAV file as artifact
```

**Matrix Strategy:**
Tests run on multiple Node.js versions to ensure compatibility:
- Node.js 18.x
- Node.js 20.x

**Artifacts:**
- `test-results-node-{version}` - Test output (7 day retention)
- `proof-wav-node-{version}` - Proof WAV file (30 day retention)

**View Results:**
1. Go to repository on GitHub
2. Click "Actions" tab
3. Select "Audio Tests" workflow
4. Click on latest run
5. View test results and download artifacts

---

### 2. Proof Tests (`proof-tests.yml`)

**Triggers:**
- Every push to `main` branch
- Every pull request to `main` branch
- Manual trigger via GitHub UI

**What it does:**
```yaml
1. Checks out code
2. Sets up Node.js 20.x
3. Installs dependencies
4. Installs Playwright with Chromium
5. Starts dev server in background
6. Runs demonstration proof tests
7. Verifies WAV file was generated
8. Uploads proof WAV file (90 day retention)
9. Creates proof summary in workflow output
```

**Special Features:**
- Explicitly tests real audio generation
- Verifies WAV file format with `file` command
- Creates markdown summary showing evidence
- Longer artifact retention (90 days)

**Manual Trigger:**
1. Go to "Actions" tab
2. Select "Proof Tests (Evidence)"
3. Click "Run workflow"
4. Select branch
5. Click "Run workflow" button

**Artifacts:**
- `proof-440hz-tone-wav` - The actual 440Hz tone WAV file

**Proof Summary:**
Each run generates a summary showing:
- ✅ WAV file generated successfully
- Format: RIFF WAVE, PCM 16-bit, mono, 44100 Hz
- Frequency: 440 Hz (A4 note)
- Duration: 1.0 second
- File size in bytes

---

## Badge Setup

The README includes status badges that show test status:

```markdown
![Audio Tests](https://github.com/USERNAME/REPO/workflows/Audio%20Tests/badge.svg)
![Proof Tests](https://github.com/USERNAME/REPO/workflows/Proof%20Tests%20(Evidence)/badge.svg)
```

**Replace:**
- `USERNAME` with your GitHub username
- `REPO` with your repository name

**Colors:**
- 🟢 Green = All tests passing
- 🔴 Red = Tests failing
- 🟡 Yellow = Tests running

---

## Local Testing Before Push

**Quick check (recommended):**
```bash
npm test
```

**Full check (all tests + proof):**
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:run-only
npm test tests/demonstration-proof.test.js
```

**This ensures:**
- All 154 tests pass locally
- Proof WAV file generates correctly
- No surprises when CI runs

---

## Troubleshooting CI Failures

### Problem: Tests fail with "ERR_CONNECTION_REFUSED"

**Cause:** Dev server not starting properly

**Solution:** Check workflow logs for server startup errors

**Fix in workflow:**
```yaml
- name: Start dev server with retry
  run: |
    npm run dev &
    sleep 5
    timeout 30 bash -c 'until curl -s http://localhost:5173; do sleep 1; done'
```

---

### Problem: Playwright browser not found

**Cause:** Chromium not installed

**Solution:** Workflow already includes this step:
```yaml
- name: Install Playwright browsers
  run: npx playwright install chromium --with-deps
```

**If still failing:** Check Playwright version in `package.json`

---

### Problem: Tests timeout

**Cause:** Headless browser taking too long

**Solution:** Increase timeout in test files:
```javascript
beforeAll(async () => {
  // ...
}, 60000); // Increase from 30000 to 60000
```

---

### Problem: Artifacts not uploaded

**Cause:** Tests fail before artifact upload

**Solution:** Use `if: always()` condition:
```yaml
- name: Upload test results
  if: always()  # Upload even if tests fail
  uses: actions/upload-artifact@v4
```

---

## Customization

### Change Node.js Versions

Edit `.github/workflows/test.yml`:
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]  # Add 22.x
```

### Run Only on Main Branch

Edit workflow triggers:
```yaml
on:
  push:
    branches: [ main ]
  # Remove pull_request section
```

### Add Slack Notifications

Add step at end of workflow:
```yaml
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Run on Schedule (Nightly)

Add to workflow triggers:
```yaml
on:
  push:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily
```

---

## Security

### Secrets Management

This project doesn't require secrets, but if needed:

1. Go to repository → Settings → Secrets
2. Click "New repository secret"
3. Add secret (e.g., `SLACK_WEBHOOK`)
4. Reference in workflow: `${{ secrets.SLACK_WEBHOOK }}`

### Dependencies

**Automatic security updates:**
- Enable Dependabot in repository settings
- Dependabot will create PRs for security updates
- CI will run on these PRs automatically

---

## Performance

### Current Performance

**Local (MacBook):**
- All tests: ~7 seconds
- Proof tests only: ~4 seconds

**GitHub Actions (Ubuntu):**
- All tests: ~10-15 seconds
- Proof tests only: ~5-8 seconds

**Why slower on CI:**
- Fresh install every time
- Headless browser startup
- Network latency

### Optimization Tips

**1. Cache npm dependencies:**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20.x'
    cache: 'npm'  # ← This line
```

**2. Cache Playwright browsers:**
```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v3
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ hashFiles('package-lock.json') }}
```

**3. Run tests in parallel:**
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
    shard: [1, 2, 3, 4]
```

---

## Cost

**GitHub Actions pricing:**
- Public repos: FREE (unlimited)
- Private repos: 2,000 minutes/month free

**This project usage:**
- ~30 seconds per run
- ~20 runs per day = 10 minutes/day
- ~300 minutes/month

**Conclusion:** Well within free tier even for private repos.

---

## Viewing Test Results

### In GitHub UI

1. Go to "Actions" tab
2. Click on workflow run
3. Click on job (e.g., "test (20.x)")
4. Expand "Run audio tests" step
5. View console output with test results

### Downloading Artifacts

1. Scroll to bottom of workflow run page
2. Find "Artifacts" section
3. Click artifact name to download
4. Extract and open `proof-440hz-tone.wav` in Audacity

### Job Summary

Proof tests create a job summary with evidence:

```
🎵 Audio Testing Proof

## Evidence of Real Audio Signal Processing

✅ Generated real WAV file: `proof-440hz-tone.wav`

- **Format:** RIFF WAVE, PCM 16-bit, mono, 44100 Hz
- **Frequency:** 440 Hz (A4 note)
- **Duration:** 1.0 second
- **Size:** 88244 bytes

📥 Download the artifact to verify in Audacity or any audio player.
```

---

## Best Practices

### 1. Test Locally First
Always run tests locally before pushing:
```bash
npm test
```

### 2. Keep Workflows Simple
Don't add unnecessary steps. Current setup is minimal and fast.

### 3. Use Matrix for Multiple Environments
Test on multiple Node versions to catch compatibility issues.

### 4. Upload Artifacts Conditionally
```yaml
if: always()  # Upload even on failure
if: success() # Upload only on success
```

### 5. Monitor Workflow Runs
Check Actions tab regularly to catch failures early.

---

## Future Enhancements

### Potential Additions

**1. Coverage Reports:**
```yaml
- name: Generate coverage
  run: npm run test:coverage
- name: Upload to Codecov
  uses: codecov/codecov-action@v3
```

**2. Performance Benchmarks:**
```yaml
- name: Run benchmarks
  run: npm run benchmark
- name: Compare to baseline
  uses: benchmark-action/github-action-benchmark@v1
```

**3. Visual Regression Testing:**
```yaml
- name: Screenshot tests
  run: npm run test:visual
- name: Compare screenshots
  uses: percy/percy-cli@v1
```

**4. Deployment on Success:**
```yaml
- name: Deploy to staging
  if: success() && github.ref == 'refs/heads/main'
  run: npm run deploy:staging
```

---

## Support

**Issues with CI/CD:**
- Check workflow logs first
- Review this document
- Open GitHub issue with workflow run URL

**Common fixes:**
- Re-run workflow (transient failures)
- Clear npm cache: `npm ci --cache .npm`
- Update dependencies: `npm update`

---

## Summary

✅ **Automated testing** on every commit
✅ **Multi-version support** (Node 18.x, 20.x)
✅ **Proof generation** with real WAV files
✅ **Artifact uploads** for verification
✅ **Status badges** for quick visibility
✅ **Zero cost** for public repos

**Next Steps:**
1. Push to GitHub
2. Check Actions tab
3. Verify tests pass
4. Download proof WAV file
5. Open in Audacity to verify real audio

**The CI/CD setup provides continuous quality assurance for audio signal processing.**

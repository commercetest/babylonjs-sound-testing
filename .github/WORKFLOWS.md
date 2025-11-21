# GitHub Actions Workflows - Quick Reference

## 🚀 Workflows Overview

### 1. Audio Tests
**File:** `.github/workflows/test.yml`
**Triggers:** Push/PR to main
**Duration:** ~10-15 seconds
**Purpose:** Run all 154 tests across multiple Node versions

```yaml
✅ Node.js 18.x tests
✅ Node.js 20.x tests
📦 Upload test results
📦 Upload proof WAV file
```

### 2. Proof Tests (Evidence)
**File:** `.github/workflows/proof-tests.yml`
**Triggers:** Push/PR to main + Manual
**Duration:** ~5-8 seconds
**Purpose:** Demonstrate real audio signal processing

```yaml
✅ Generate proof-440hz-tone.wav
✅ Verify WAV format
📦 Upload WAV artifact (90 days)
📝 Create evidence summary
```

---

## 📊 What Gets Tested

| Component | Tests | Method |
|-----------|-------|--------|
| API Contracts | 36 | Mocked |
| Audio Generation | 17 | Real FFT |
| Advanced DSP | 36 | Real FFT |
| Edge Cases | 59 | Mixed |
| Proof/Evidence | 6 | Real WAV |
| **Total** | **154** | **58% Real Audio** |

---

## 🎯 Quick Commands

### View Workflow Status
```bash
# Visit in browser
https://github.com/USERNAME/REPO/actions
```

### Download Artifacts
1. Go to Actions tab
2. Click workflow run
3. Scroll to "Artifacts"
4. Download `proof-440hz-tone-wav`

### Manual Trigger (Proof Tests)
1. Actions → Proof Tests (Evidence)
2. Run workflow → main → Run

---

## 🔧 Local Testing

**Before pushing:**
```bash
# Quick check
npm test

# Full check
npm run dev &
npm run test:run-only
npm test tests/demonstration-proof.test.js
```

---

## 📈 Status Badges

```markdown
![Audio Tests](https://github.com/USERNAME/REPO/workflows/Audio%20Tests/badge.svg)
![Proof Tests](https://github.com/USERNAME/REPO/workflows/Proof%20Tests%20(Evidence)/badge.svg)
```

🟢 Green = Passing
🔴 Red = Failing
🟡 Yellow = Running

---

## 🐛 Troubleshooting

**Tests fail in CI but pass locally?**
- Check Node version matches
- Review workflow logs
- Try: Re-run workflow

**Artifacts not uploaded?**
- Tests must run (even if failed)
- Check `if: always()` condition
- Artifacts expire (7-90 days)

**Slow CI runs?**
- Normal: CI is slower than local
- Check: No hanging processes
- Optimize: Cache npm modules

---

## 💰 Cost

**Public repos:** FREE unlimited
**Private repos:** 2,000 min/month free

**This project:** ~30s/run = 300 min/month
**Verdict:** ✅ Well within free tier

---

## 📚 Documentation

- **Setup Guide:** [docs/ci-cd-setup.md](../docs/ci-cd-setup.md)
- **Test Proof:** [docs/skeptics-guide.md](../docs/skeptics-guide.md)
- **Main README:** [README.md](../README.md)

---

## ✅ Checklist After Setup

- [ ] Push to GitHub
- [ ] Check Actions tab
- [ ] Verify tests pass
- [ ] Download proof WAV
- [ ] Open WAV in Audacity
- [ ] Confirm badges display
- [ ] Update badge URLs (if needed)

---

**The CI/CD setup ensures audio quality on every commit! 🎵**

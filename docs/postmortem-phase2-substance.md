# Phase 2 Substance Postmortem

## Summary

Phase 2 made the app noticeably less toy-like on real files without changing the deployment model or adding a backend. The core loop is still import, analyze, master, preview, export. The difference is that import now behaves like a mastering assistant instead of a dumb file picker.

## Real-Data Pass Rate

Before: 1/10 fixtures completed the intended flow with a trustworthy first guess.

After:

| Fixture                | Before | After | Notes                                                 |
| ---------------------- | ------ | ----- | ----------------------------------------------------- |
| `01-clean-stereo-song` | pass   | pass  | clean music stays fast                                |
| `02-mono-voice-memo`   | fail   | pass  | speech detected, podcast preset inferred              |
| `03-long-form-podcast` | fail   | pass  | long-form flagged, progress and cancel path preserved |
| `04-clipped-master`    | fail   | pass  | hot-master anomaly detected and chain softened        |
| `05-dynamic-classical` | fail   | pass  | dynamic material gets gentler target and intensity    |
| `06-wide-edm`          | fail   | pass  | wide-stereo anomaly suppresses extra widening         |
| `07-near-silence`      | fail   | pass  | blocked with explicit silence diagnosis               |
| `08-dc-offset-rumble`  | fail   | pass  | DC offset and rumble surfaced as anomalies            |
| `09-surround-5_1`      | fail   | pass  | multichannel blocked with next step                   |
| `10-fake-mp3`          | fail   | pass  | header sniff rejects invalid audio before decode      |

Result: 10/10 fixtures now produce a correct first action, which is either a usable first guess or an explicit block with a reason and next step.

## Top 5 Logic Gaps Closed

1. Source classification:
   closed with `SourceProfile` inference and confidence scoring.
2. Missing anomaly model:
   closed with preflight and analysis anomalies for silence, clipping, long-form, DC offset, width, rumble, multichannel, and invalid files.
3. No confidence surface:
   closed with source insight, provenance, and debug surfaces.
4. All-or-nothing flow:
   closed with explicit preflight, analyzed, blocked, mastering, cancelled, and mastered states.
5. Missing provenance:
   closed with deterministic fingerprints and export metadata.

## Smart Behaviors Promised Vs Observed

- Import yields classification, confidence, anomalies, and a recommended chain:
  working on the full 10-fixture set.
- Speech, silence, hot masters, and surround are recognized automatically:
  working on the full 10-fixture set.
- The first mastering preview is useful without manual preset changes on common inputs:
  working on the 7 non-blocked mastering fixtures.
- The app explains risky cases in mastering language:
  working on all blocked or warned fixtures.
- Repeat runs are deterministic:
  working for the repeated WAV export test fixture.

## Determinism Check

| Check                                                       | Result |
| ----------------------------------------------------------- | ------ |
| identical input bytes produce identical source fingerprint  | pass   |
| identical input + options produce byte-identical WAV export | pass   |
| provenance is embedded without export-time entropy          | pass   |

## Performance Numbers

Measured on the committed fixtures in local desktop browsers and test runs.

| Operation                                 | Median      | P95         | Worst       |
| ----------------------------------------- | ----------- | ----------- | ----------- |
| preflight sniff                           | under 50ms  | under 80ms  | under 100ms |
| source analysis on short fixtures         | under 300ms | under 700ms | about 1.2s  |
| long-form classification fixture test     | about 5.6s  | n/a         | about 5.6s  |
| deterministic 4-second master/export test | about 12s   | n/a         | about 12s   |

The important behavioral change is that long work is now visible and cancellable instead of silent.

## What Surprised Us

- The long-form podcast fixture was the fastest way to expose where a browser-only product needs honesty more than raw speed.
- A renamed non-audio file was a better product test than several "hard" DSP examples because it showed how much trust is won at the boundary.
- Deterministic export metadata needed restraint. Even helpful timestamps can quietly break reproducibility.

## Still Open: Best Phase 3 Candidates

1. Optional deterministic stereo downmix for multichannel sources.
2. Faster long-form analysis through chunked measurement rather than full eager decode.
3. Confidence-calibrated preview comparisons between source and mastered output.
4. More nuanced speech-plus-music mixed-content handling.
5. Persisted but transparent user defaults with reset controls.

## Honest Take

It no longer feels like a toy on the inputs that made v1 look naive. It still is not a substitute for a human mastering engineer, and long-form browser processing remains a practical limit, but the app now knows when to help, when to warn, and when to refuse. That change matters more than any visual polish would have.

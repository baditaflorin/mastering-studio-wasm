# Phase 2 Real-Data Audit

## Overview

The v1 app works on the happy path for short, clean stereo music files. It starts feeling toy-like when the user brings long-form speech, already-mastered material, silence, clipped sources, multichannel audio, or damaged files.

This fixture set is the grading rubric for Phase 2 substance. Every significant logic change re-runs these fixtures.

## Fixture Audit

| Fixture                    | Input                                      | What v1 did                                                       | What it should do                                                             | Why v1 failed             | Failure shape         | Manual work the app should do                    |
| -------------------------- | ------------------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------- | --------------------- | ------------------------------------------------ |
| `01-clean-stereo-song.wav` | Clean 3-minute stereo song                 | Imported, analyzed, mastered, exported                            | Same                                                                          | None                      | Pass                  | None                                             |
| `02-mono-voice-memo.wav`   | Mono speech memo with light rumble         | Treated as generic music unless user picked `podcast`             | Detect speech, recommend `podcast`, lighten stereo processing                 | No source classification  | Wrong-but-confident   | User must pick the obvious preset                |
| `03-long-form-podcast.wav` | Long-form spoken-word mono file            | Decodes and processes as if duration is normal                    | Preflight memory/time, show progress, allow cancel, recommend speech chain    | No size/perf model        | Brittle               | User must guess whether it is safe to run        |
| `04-clipped-master.wav`    | Already-hot clipped master                 | Applies more compression/saturation                               | Detect clipping and back off or warn before re-mastering                      | No anomaly detection      | Wrong-but-confident   | User must realize the app is making it worse     |
| `05-dynamic-classical.wav` | Wide-dynamic orchestral-style program      | Pushes toward standard loudness target                            | Preserve dynamics, recommend gentler target and intensity                     | Static defaults           | Wrong-but-confident   | User must know to turn things down               |
| `06-wide-edm.wav`          | Loud wide stereo electronic source         | Often still treated with generic chain                            | Detect already-loud/high-width material, reduce width and intensity if needed | No profile-aware defaults | Wrong-but-confident   | User must trim the chain manually                |
| `07-near-silence.wav`      | Near-silent file                           | Can analyze to extreme values and still allow mastering           | Detect silence and stop with a clear next step                                | Silence not modeled       | Silent wrongness      | User must infer the file is unusable             |
| `08-dc-offset-rumble.wav`  | Source with DC offset and heavy sub-rumble | Processes it but does not explain the anomaly                     | Detect and report the anomaly, show what the chain corrected                  | Metrics are too shallow   | Silent wrongness      | User must trust invisible corrections            |
| `09-surround-5_1.wav`      | Six-channel surround source                | Accepts channels generically; stereo-specific logic is misleading | Detect multichannel, warn, offer deterministic downmix policy                 | Layout not modeled        | Wrong-but-confident   | User must understand channel-layout implications |
| `10-fake-mp3.mp3`          | Non-audio file renamed to `.mp3`           | Reaches generic decode failure                                    | Sniff signature and explain that the file is not valid audio                  | No boundary validation    | Obvious but unhelpful | User must debug the file identity                |

## Top 5 Logic Gaps

1. The app does not classify the source before choosing a mastering chain.
2. The app has no anomaly model for silence, clipping, DC offset, multichannel, or suspiciously long inputs.
3. The app does not surface confidence or reasoning for its inferences.
4. The app treats import and mastering as all-or-nothing steps rather than staged preflight, classify, then process.
5. Exported output lacks strong provenance about why this master was produced.

## Top 3 Intuition Failures

1. Users expect the app to know when a file is speech versus music.
2. Users expect the app to hesitate on silence, clipping, or surround inputs instead of confidently plowing ahead.
3. Users expect a long or risky job to be interruptible and honest about cost.

## Top 3 Feels-Stupid Moments

1. A mono voice memo still needs the user to select `podcast`.
2. A clipped master can be made louder again without the app protesting.
3. A renamed bad file is only rejected after a generic decode failure.

## Smart Behavior Definition

For this product, "smart" means:

1. Importing a file immediately yields a source classification, confidence score, anomalies, and a recommended mastering chain.
2. Speech, already-mastered material, silence, and multichannel audio are recognized without the user telling the app.
3. The first mastering preview is a useful guess on the first import for common inputs.
4. The app explains risky cases in audio-language and offers a next step instead of a stack-flavored error.
5. The same input and settings always produce the same audio output and the same provenance metadata.

## Success Metrics

1. At least 7 of the 10 fixtures complete the primary flow with no manual preset change.
2. At least 9 of the 10 fixtures either receive a correct classification or an explicit low-confidence warning.
3. Every blocked or failed input reports a `what`, `why`, and `now what`.
4. Mastering the same fixture twice with the same settings produces byte-identical WAV output.
5. Inputs above the long-form threshold show progress and can be cancelled during mastering.
6. No fixture produces a confidently wrong master without a warning.

## Out Of Scope

1. No backend or architecture mode change.
2. No batch mastering, cloud sync, account system, or new business features.
3. No purely cosmetic redesign work.
4. No custom ML training.
5. No expansion beyond the existing import, analyze, master, preview, export loop.
